import {
    emitGroup,
    GroupParticipantFinalResult,
    registerGroupResultResolver,
} from "@/sockets/group-roll-socket";
import { warn } from "@/utils/logging";

export interface GroupRollInput {
    title: string;
    heroes: GroupRollHeroInput[];
    source?: string;
    metadata?: Record<string, unknown>;
}

export interface GroupRollHeroInput {
    uuid: string;
    name: string;
    img: string;
}

export type GroupRollResult = GroupParticipantFinalResult;

export async function groupRoll(
    input: GroupRollInput
): Promise<GroupRollResult[]> {
    if (!game.user?.isGM) {
        warn("groupRoll() must be invoked by the GM client.");
        return [];
    }

    if (!Array.isArray(input?.heroes) || !input.heroes.length) {
        warn("groupRoll() called with no heroes.");
        return [];
    }

    const groupId = foundry.utils.randomID();
    const participants = await Promise.all(
        input.heroes.map(async (hero) => ({
            uuid: hero.uuid,
            userId: await resolveOwningUserId(hero.uuid),
            name: hero.name,
            img: hero.img,
        }))
    );

    return new Promise<GroupRollResult[]>((resolve) => {
        registerGroupResultResolver(groupId, resolve);
        emitGroup({
            type: "groupRoll:start",
            payload: {
                groupId,
                title: input.title || "Group Roll",
                rollType: "Test",
                participants,
            },
        });
    });
}

async function resolveOwningUserId(uuid: string): Promise<string | null> {
    try {
        const fn = (globalThis as any).fromUuid;
        const actor = typeof fn === "function" ? await fn(uuid) : null;
        if (!actor) return null;

        const ownership = (actor as any).ownership ?? {};
        const OWNERSHIP_LEVELS = (CONST as any)?.DOCUMENT_OWNERSHIP_LEVELS ?? {
            OWNER: 3,
        };

        const ownerEntry = Object.entries(ownership).find(
            ([userId, level]) =>
                userId !== "default" &&
                Number(level) >= Number(OWNERSHIP_LEVELS.OWNER) &&
                !game.users?.get(userId)?.isGM
        );

        return ownerEntry?.[0] ?? null;
    } catch (err) {
        warn("Failed to resolve owning user for actor", uuid, err);
        return null;
    }
}
