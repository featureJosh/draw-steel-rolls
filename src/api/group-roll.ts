import {
    broadcastGroupRollStart,
    GroupParticipantFinalResult,
    GroupStartPayload,
    registerGroupResultResolver,
} from "@/sockets/group-roll-socket";
import { debug, warn } from "@/utils/logging";

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
    /** If omitted, the GM client infers a default player owner from the actor. */
    userId?: string | null;
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
    const participants = input.heroes.map((hero) => ({
        uuid: hero.uuid,
        name: hero.name,
        img: hero.img,
        userId: hero.userId ?? resolveDefaultOwnerUserId(hero.uuid),
    }));

    debug("Group roll requested", {
        groupId,
        title: input.title || "Group Roll",
        participants: participants.map((participant) => ({
            uuid: participant.uuid,
            name: participant.name,
            userId: participant.userId,
        })),
    });

    const payload: GroupStartPayload = {
        groupId,
        title: input.title || "Group Roll",
        rollType: "Test",
        participants,
    };

    return new Promise<GroupRollResult[]>((resolve) => {
        registerGroupResultResolver(groupId, resolve);
        broadcastGroupRollStart(payload);
    });
}

function resolveDefaultOwnerUserId(actorUuid: string): string | null {
    try {
        const doc = fromUuidSync(actorUuid);
        const actor = doc as Actor | null;
        if (!actor || actor.documentName !== "Actor") return null;
        const ownership = actor.ownership;
        if (!ownership) return null;
        const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
        for (const user of game.users ?? []) {
            if (user.isGM) continue;
            const level = ownership[user.id];
            if (typeof level === "number" && level >= ownerLevel) return user.id;
        }
        return null;
    } catch {
        return null;
    }
}
