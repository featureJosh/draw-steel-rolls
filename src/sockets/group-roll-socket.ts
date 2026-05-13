import { MODULE_ID } from "@/config/constants";
import {
    GroupParticipantConfig,
    GroupParticipantResult,
    GroupRollOverlayData,
    useGroupRollStore,
} from "@/stores/group-roll-store";
import {
    PowerRollPromptResult,
    requestPowerRollSetup,
} from "@/stores/roll-overlay-store";
import { error, warn } from "@/utils/logging";

const SOCKET_CHANNEL = `module.${MODULE_ID}`;

type GroupStartPayload = {
    groupId: string;
    title: string;
    rollType: string;
    participants: GroupParticipantPayload[];
};

type GroupParticipantPayload = {
    uuid: string;
    name: string;
    img: string;
};

type GroupReadyPayload = {
    groupId: string;
    actorUuid: string;
    config: GroupParticipantConfig;
};

type GroupParticipantResolvedPayload = {
    groupId: string;
    actorUuid: string;
    result: GroupParticipantResult;
};

type GroupCancelPayload = { groupId: string };

type GroupSocketMessage =
    | { type: "groupRoll:start"; payload: GroupStartPayload }
    | { type: "groupRoll:ready"; payload: GroupReadyPayload }
    | { type: "groupRoll:participantResolved"; payload: GroupParticipantResolvedPayload }
    | { type: "groupRoll:cancel"; payload: GroupCancelPayload };

const groupResultResolvers = new Map<
    string,
    (results: GroupParticipantFinalResult[]) => void
>();

export interface GroupParticipantFinalResult {
    actorUuid: string;
    name: string;
    skill: string | null;
    total: number;
    modifier: number;
    edges: number;
    banes: number;
    bonuses: number;
    dice: number[];
    formula: string;
}

export function setupGroupRollSocket() {
    if (!game.socket) {
        warn("game.socket unavailable; group roll sync disabled.");
        return;
    }

    game.socket.on(SOCKET_CHANNEL, (message: GroupSocketMessage) => {
        handleGroupSocketMessage(message);
    });
}

export function emitGroup(message: GroupSocketMessage) {
    game.socket?.emit(SOCKET_CHANNEL, message);
    handleGroupSocketMessage(message);
}

function handleGroupSocketMessage(message: GroupSocketMessage) {
    switch (message.type) {
        case "groupRoll:start":
            return onGroupStart(message.payload);
        case "groupRoll:ready":
            return onGroupReady(message.payload);
        case "groupRoll:participantResolved":
            return onParticipantResolved(message.payload);
        case "groupRoll:cancel":
            return onGroupCancel(message.payload);
    }
}

function onGroupStart(payload: GroupStartPayload) {
    const isGm = !!game.user?.isGM;

    const data: GroupRollOverlayData = {
        groupId: payload.groupId,
        title: payload.title,
        rollType: payload.rollType,
        isGm,
        participants: payload.participants.map((p) => ({
            uuid: p.uuid,
            userId: null,
            name: p.name,
            img: p.img,
            status: "setup",
        })),
    };

    useGroupRollStore.getState().show(data);

    if (isGm) return;

    for (const participant of payload.participants) {
        void openSoloSetupIfOwned(payload, participant);
    }
}

async function openSoloSetupIfOwned(
    payload: GroupStartPayload,
    participant: GroupParticipantPayload
) {
    try {
        const actor = (await safeFromUuid(participant.uuid)) as
            | (Actor & {
                  isOwner?: boolean;
                  system?: { skills?: unknown };
              })
            | null;

        if (!actor) {
            warn("Group roll: actor not found locally", participant.uuid);
            return;
        }
        if (!actor.isOwner) return;
        if (game.user?.isGM) return;

        const skillOptions = buildSkillOptionsForActor(actor);

        const result = await requestPowerRollSetup({
            title: payload.title,
            rollType: payload.rollType,
            actorName: participant.name,
            formula: "2d10",
            modifiers: { edges: 0, banes: 0, bonuses: 0 },
            messageMode: "public",
            skill: null,
            skillOptions,
            skillModifiers: {},
        });

        if (!result) return;

        const config = promptResultToConfig(result);
        emitGroup({
            type: "groupRoll:ready",
            payload: {
                groupId: payload.groupId,
                actorUuid: participant.uuid,
                config,
            },
        });
    } catch (err) {
        warn("Failed to open group roll setup for participant", err);
    }
}

function buildSkillOptionsForActor(actor: {
    system?: { skills?: unknown };
}): { value: string; label: string; group?: string }[] {
    const skills = actor?.system?.skills;
    const values = collectSkillValues(skills);
    if (!values.length) return [];

    const list = (globalThis as any).ds?.CONFIG?.skills?.list ?? {};
    const groups = (globalThis as any).ds?.CONFIG?.skills?.groups ?? {};

    return values.map((value) => {
        const skill = list[value];
        const groupKey = skill?.group;
        const label =
            typeof skill?.label === "string"
                ? localizeMaybe(skill.label)
                : value;
        const group = groupKey
            ? localizeMaybe(groups[groupKey]?.label ?? groupKey)
            : undefined;
        return { value, label, group };
    });
}

function collectSkillValues(skills: unknown): string[] {
    if (!skills) return [];
    if (skills instanceof Set) return Array.from(skills).map(String);
    if (Array.isArray(skills)) return skills.map(String);
    if (typeof (skills as any).values === "function") {
        try {
            return Array.from((skills as any).values()).map(String);
        } catch {
            // fall through
        }
    }
    if (typeof skills === "object") return Object.keys(skills);
    return [];
}

function localizeMaybe(label: string): string {
    return game.i18n?.has?.(label) ? game.i18n.localize(label) : label;
}

function promptResultToConfig(
    result: PowerRollPromptResult
): GroupParticipantConfig {
    const modifiers = result.rolls[0];
    return {
        edges: modifiers.edges,
        banes: modifiers.banes,
        bonuses: modifiers.bonuses,
        skill: result.skill,
        messageMode: result.messageMode,
    };
}

function onGroupReady(payload: GroupReadyPayload) {
    useGroupRollStore.getState().markReady(payload.actorUuid, payload.config);
}

function onParticipantResolved(payload: GroupParticipantResolvedPayload) {
    useGroupRollStore
        .getState()
        .setResolved(payload.actorUuid, payload.result);
}

function onGroupCancel(payload: GroupCancelPayload) {
    const resolver = groupResultResolvers.get(payload.groupId);
    if (resolver) {
        groupResultResolvers.delete(payload.groupId);
        resolver([]);
    }
    useGroupRollStore.getState().hide();
    window.setTimeout(() => useGroupRollStore.getState().clear(), 500);
}

export function registerGroupResultResolver(
    groupId: string,
    resolve: (results: GroupParticipantFinalResult[]) => void
) {
    groupResultResolvers.set(groupId, resolve);
}

export function resolveGroupResults(
    groupId: string,
    results: GroupParticipantFinalResult[]
) {
    const resolver = groupResultResolvers.get(groupId);
    if (!resolver) return;
    groupResultResolvers.delete(groupId);
    resolver(results);
}

export async function rollAllParticipants(groupId: string) {
    const state = useGroupRollStore.getState();
    const data = state.current;
    if (!data || data.groupId !== groupId) return;
    if (!game.user?.isGM) return;

    const finalResults: GroupParticipantFinalResult[] = [];

    for (const participant of data.participants) {
        if (!participant.config) continue;

        useGroupRollStore.getState().setRolling(participant.uuid);

        try {
            const result = await rollParticipant(participant.uuid, participant.config, data.title);
            useGroupRollStore.getState().setResolved(participant.uuid, result.view);

            emitGroup({
                type: "groupRoll:participantResolved",
                payload: {
                    groupId,
                    actorUuid: participant.uuid,
                    result: result.view,
                },
            });

            finalResults.push({
                actorUuid: participant.uuid,
                name: participant.name,
                skill: participant.config.skill,
                total: result.view.total,
                modifier: result.view.modifier,
                edges: participant.config.edges,
                banes: participant.config.banes,
                bonuses: participant.config.bonuses,
                dice: result.view.dice.map((d) => d.value),
                formula: result.view.formula,
            });

            await sleep(400);
        } catch (err) {
            error("Failed to resolve group roll participant", err);
        }
    }

    resolveGroupResults(groupId, finalResults);
}

async function rollParticipant(
    uuid: string,
    config: GroupParticipantConfig,
    groupTitle: string
): Promise<{ view: GroupParticipantResult; messageId: string | null }> {
    const actor = await safeFromUuid(uuid);
    const modifier =
        toInt(config.bonuses) + 2 * toInt(config.edges) - 2 * toInt(config.banes);

    const formula =
        modifier === 0
            ? "2d10"
            : `2d10 ${modifier >= 0 ? "+" : "-"} ${Math.abs(modifier)}`;

    const roll = await new Roll(formula).evaluate({ async: true } as any);

    const dieTerm = roll.dice.find((d: any) => Number(d.faces) === 10);
    const dice = (dieTerm?.results ?? []).map((r: any) => ({
        value: Number(r.result ?? 0),
        active: r.active !== false,
    }));

    const total = Number(roll.total ?? 0);
    const netBoon = toInt(config.edges) - toInt(config.banes);

    const speaker = actor
        ? ChatMessage.getSpeaker({ actor: actor as Actor })
        : undefined;

    let messageId: string | null = null;
    try {
        const message = await ChatMessage.create({
            speaker,
            rolls: [roll],
            flags: {
                [MODULE_ID]: {
                    groupRollId: useGroupRollStore.getState().current?.groupId,
                    actorUuid: uuid,
                },
            },
            flavor: `${groupTitle} — Group Roll`,
        } as any);
        messageId = (message as any)?.id ?? null;
    } catch (err) {
        warn("Failed to create group roll chat message", err);
    }

    if (messageId) await waitForDice(messageId);

    return {
        view: {
            total,
            modifier,
            dice,
            netBoon,
            tier: undefined,
            formula: formatRollFormula(dice, modifier, total),
        },
        messageId,
    };
}

async function safeFromUuid(uuid: string): Promise<unknown | null> {
    try {
        const fn = (globalThis as any).fromUuid;
        if (typeof fn === "function") return await fn(uuid);
    } catch {
        return null;
    }
    return null;
}

function toInt(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function formatRollFormula(
    dice: { value: number; active: boolean }[],
    modifier: number,
    total: number
) {
    const diceText = dice.map((d) => d.value).join(" + ");
    const modText =
        modifier === 0
            ? ""
            : ` ${modifier > 0 ? "+" : "-"} ${Math.abs(modifier)}`;
    return `${diceText}${modText} = ${total}`;
}

function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForDice(messageId: string) {
    const dice3d = (game as any).dice3d;
    if (!dice3d) return;

    const wait =
        dice3d.waitFor3DAnimationByMessageID ??
        dice3d.waitFor3DAnimationByMessageId;

    if (typeof wait === "function") {
        try {
            await Promise.race([
                Promise.resolve(wait.call(dice3d, messageId)),
                new Promise((r) => window.setTimeout(r, 4000)),
            ]);
        } catch {
            // ignore
        }
    }
}
