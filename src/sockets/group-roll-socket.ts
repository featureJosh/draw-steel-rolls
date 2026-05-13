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
    useRollOverlayStore,
} from "@/stores/roll-overlay-store";
import { debug, error, warn } from "@/utils/logging";

export type GroupStartPayload = {
    groupId: string;
    title: string;
    rollType: string;
    participants: GroupParticipantPayload[];
};

export type GroupParticipantPayload = {
    uuid: string;
    name: string;
    img: string;
    /** Player user id for this hero when known; used to route setup on clients. */
    userId: string | null;
};

export type GroupReadyPayload = {
    groupId: string;
    actorUuid: string;
    config: GroupParticipantConfig;
};

export type GroupParticipantResolvedPayload = {
    groupId: string;
    actorUuid: string;
    result: GroupParticipantResult;
};

export type GroupCancelPayload = { groupId: string };

type SocketlibSocket = {
    register: (name: string, fn: (...args: any[]) => any) => void;
    executeForEveryone: (name: string, ...args: any[]) => Promise<unknown>;
    executeAsGM: (name: string, ...args: any[]) => Promise<unknown>;
};

let socket: SocketlibSocket | undefined;

const groupResultResolvers = new Map<
    string,
    (results: GroupParticipantFinalResult[]) => void
>();
const startedSetupParticipants = new Set<string>();
const activeGroupStarts = new Map<string, GroupStartPayload>();
const joinedGroupIds = new Set<string>();
const readyParticipantConfigs = new Map<
    string,
    Map<string, GroupParticipantConfig>
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
    (Hooks as any).once("socketlib.ready", () => {
        const lib = (globalThis as any).socketlib;
        if (!lib?.registerModule) {
            warn("socketlib not available; group roll sync disabled.");
            return;
        }

        socket = lib.registerModule(MODULE_ID) as SocketlibSocket;
        socket.register("groupRoll:start", handleGroupRollStart);
        socket.register("groupRoll:ready", handleGroupRollReady);
        socket.register("groupRoll:participantResolved", handleGroupParticipantResolved);
        socket.register("groupRoll:cancel", handleGroupRollCancel);

        debug("socketlib group roll handlers registered", {
            userId: game.user?.id,
            isGm: game.user?.isGM,
        });
    });
}

function ensureSocket(): SocketlibSocket | null {
    if (socket) return socket;
    warn("Group roll socket not ready; message dropped.");
    return null;
}

export function broadcastGroupRollStart(payload: GroupStartPayload) {
    debug("Broadcasting groupRoll:start", { groupId: payload.groupId });
    ensureSocket()?.executeForEveryone("groupRoll:start", payload);
    handleGroupRollStart(payload);
}

export function sendGroupRollReadyToGM(payload: GroupReadyPayload) {
    debug("Sending groupRoll:ready to GM", {
        groupId: payload.groupId,
        actorUuid: payload.actorUuid,
    });
    if (game.user?.isGM) {
        handleGroupRollReady(payload);
        return;
    }
    ensureSocket()?.executeAsGM("groupRoll:ready", payload);
}

export function broadcastGroupParticipantResolved(
    payload: GroupParticipantResolvedPayload
) {
    debug("Broadcasting groupRoll:participantResolved", {
        groupId: payload.groupId,
        actorUuid: payload.actorUuid,
    });
    ensureSocket()?.executeForEveryone("groupRoll:participantResolved", payload);
    handleGroupParticipantResolved(payload);
}

export function broadcastGroupRollCancel(payload: GroupCancelPayload) {
    debug("Broadcasting groupRoll:cancel", { groupId: payload.groupId });
    ensureSocket()?.executeForEveryone("groupRoll:cancel", payload);
    handleGroupRollCancel(payload);
}

export function handleGroupRollStart(payload: GroupStartPayload) {
    const isGm = !!game.user?.isGM;
    activeGroupStarts.set(payload.groupId, payload);

    debug("Received group roll start", {
        groupId: payload.groupId,
        userId: game.user?.id,
        isGm,
        participants: payload.participants.map((participant) => ({
            uuid: participant.uuid,
            name: participant.name,
            userId: participant.userId,
        })),
    });

    if (isGm) {
        showGroupRollOverlay(payload);
        return;
    }

    void openOwnedParticipantSetups(payload);
}

async function openOwnedParticipantSetups(payload: GroupStartPayload) {
    for (const participant of payload.participants) {
        await openSoloSetupIfOwned(payload, participant);
    }
}

async function openSoloSetupIfOwned(
    payload: GroupStartPayload,
    participant: GroupParticipantPayload
) {
    try {
        const setupKey = `${payload.groupId}.${participant.uuid}`;
        if (startedSetupParticipants.has(setupKey)) return;
        startedSetupParticipants.add(setupKey);

        const actor = (await safeFromUuid(participant.uuid)) as
            | (Actor & {
                  isOwner?: boolean;
                  system?: { skills?: unknown };
              })
            | null;

        if (!actor) {
            startedSetupParticipants.delete(setupKey);
            warn("Group roll: actor not found locally", participant.uuid);
            return;
        }

        const hasOwnerPermission = game.user
            ? actor.testUserPermission(game.user, "OWNER")
            : false;

        if (!hasOwnerPermission || game.user?.isGM) {
            startedSetupParticipants.delete(setupKey);
            return;
        }

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
        closeSubmittedPowerRollSetup();
        joinedGroupIds.add(payload.groupId);
        showGroupRollOverlay(payload);
        sendGroupRollReadyToGM({
            groupId: payload.groupId,
            actorUuid: participant.uuid,
            config,
        });
    } catch (err) {
        startedSetupParticipants.delete(`${payload.groupId}.${participant.uuid}`);
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

export function handleGroupRollReady(payload: GroupReadyPayload) {
    debug("Received group roll participant ready", {
        groupId: payload.groupId,
        actorUuid: payload.actorUuid,
        userId: game.user?.id,
        isGm: game.user?.isGM,
        config: payload.config,
    });
    rememberReadyParticipant(payload);
    if (!useGroupRollStore.getState().current) {
        const startPayload = activeGroupStarts.get(payload.groupId);
        if (
            startPayload &&
            (game.user?.isGM || joinedGroupIds.has(payload.groupId))
        ) {
            showGroupRollOverlay(startPayload);
        }
    }
    useGroupRollStore.getState().markReady(payload.actorUuid, payload.config);
}

export function handleGroupParticipantResolved(
    payload: GroupParticipantResolvedPayload
) {
    debug("Received group roll participant resolved", {
        groupId: payload.groupId,
        actorUuid: payload.actorUuid,
    });
    useGroupRollStore
        .getState()
        .setResolved(payload.actorUuid, payload.result);
}

export function handleGroupRollCancel(payload: GroupCancelPayload) {
    debug("Received group roll cancel", { groupId: payload.groupId });
    clearStartedSetupParticipants(payload.groupId);
    activeGroupStarts.delete(payload.groupId);
    joinedGroupIds.delete(payload.groupId);
    readyParticipantConfigs.delete(payload.groupId);
    const resolver = groupResultResolvers.get(payload.groupId);
    if (resolver) {
        groupResultResolvers.delete(payload.groupId);
        resolver([]);
    }
    const rollOverlay = useRollOverlayStore.getState();
    if (
        rollOverlay.current?.phase === "setup" ||
        rollOverlay.current?.phase === "rolling"
    ) {
        rollOverlay.cancelSetup();
    }
    useGroupRollStore.getState().hide();
    window.setTimeout(() => useGroupRollStore.getState().clear(), 500);
}

export function cancelGroupRoll(groupId: string) {
    broadcastGroupRollCancel({ groupId });
}

export function closeGroupRollOverlay() {
    useGroupRollStore.getState().hide();
    window.setTimeout(() => useGroupRollStore.getState().clear(), 500);
}

function clearStartedSetupParticipants(groupId: string) {
    for (const key of Array.from(startedSetupParticipants)) {
        if (key.startsWith(`${groupId}.`)) startedSetupParticipants.delete(key);
    }
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

function showGroupRollOverlay(payload: GroupStartPayload) {
    const readyConfigs = readyParticipantConfigs.get(payload.groupId);
    const data: GroupRollOverlayData = {
        groupId: payload.groupId,
        title: payload.title,
        rollType: payload.rollType,
        isGm: !!game.user?.isGM,
        participants: payload.participants.map((p) => {
            const config = readyConfigs?.get(p.uuid);
            return {
                uuid: p.uuid,
                userId: p.userId,
                name: p.name,
                img: p.img,
                status: config ? "ready" : "setup",
                config,
            };
        }),
    };

    useGroupRollStore.getState().show(data);
}

function rememberReadyParticipant(payload: GroupReadyPayload) {
    const groupReady =
        readyParticipantConfigs.get(payload.groupId) ??
        new Map<string, GroupParticipantConfig>();
    groupReady.set(payload.actorUuid, payload.config);
    readyParticipantConfigs.set(payload.groupId, groupReady);
}

function closeSubmittedPowerRollSetup() {
    const store = useRollOverlayStore.getState();
    const current = store.current;
    if (current?.phase !== "rolling") return;

    store.hide();
    window.setTimeout(() => useRollOverlayStore.getState().clear(), 500);
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

            broadcastGroupParticipantResolved({
                groupId,
                actorUuid: participant.uuid,
                result: result.view,
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
    clearStartedSetupParticipants(groupId);
    activeGroupStarts.delete(groupId);
    joinedGroupIds.delete(groupId);
    readyParticipantConfigs.delete(groupId);
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
