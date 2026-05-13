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
    const participants = input.heroes.map((hero) => ({
        uuid: hero.uuid,
        name: hero.name,
        img: hero.img,
    }));

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
