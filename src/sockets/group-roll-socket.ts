import { MODULE_ID } from "@/config/constants";
import {
    GroupParticipantConfig,
    GroupParticipantResult,
    GroupRollMetadata,
    GroupRollOverlayData,
    useGroupRollStore,
} from "@/stores/group-roll-store";
import {
    PowerRollPromptResult,
    requestPowerRollSetup,
    showRollOverlay,
    useRollOverlayStore,
} from "@/stores/roll-overlay-store";
import { error, info, warn } from "@/utils/logging";

export type GroupStartPayload = {
    groupId: string;
    title: string;
    rollType: string;
    participants: GroupParticipantPayload[];
    metadata?: GroupRollMetadata;
};

const MONTAGE_DIFFICULTY_OPTIONS = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
];

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

export type GroupParticipantRollingPayload = {
    groupId: string;
    actorUuid: string;
};

export type GroupCancelPayload = { groupId: string };

type SocketlibSocket = {
    register: (name: string, fn: (...args: any[]) => any) => void;
    executeForEveryone: (name: string, ...args: any[]) => Promise<unknown>;
    executeAsGM: (name: string, ...args: any[]) => Promise<unknown>;
    executeForUsers: (userIds: string[], name: string, ...args: any[]) => Promise<unknown>;
};

export interface SoloRollRequestPayload {
    uuid: string;
    name: string;
    img: string;
    title: string;
    characteristic: string | null;
    skill: string | null;
}

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
    tier: number;
    product: number;
    difficulty: string | null;
}

function registerSocketlibHandlers() {
    if (socket) {
        info("socketlib already registered; skipping duplicate registration");
        return;
    }
    const lib = (globalThis as any).socketlib;
    if (!lib?.registerModule) {
        warn("socketlib global not available at registration time.");
        return;
    }

    try {
        socket = lib.registerModule(MODULE_ID) as SocketlibSocket;
        socket.register("groupRoll:start", handleGroupRollStart);
        socket.register("groupRoll:ready", handleGroupRollReady);
        socket.register("groupRoll:participantRolling", handleGroupParticipantRolling);
        socket.register("groupRoll:participantResolved", handleGroupParticipantResolved);
        socket.register("groupRoll:cancel", handleGroupRollCancel);
        socket.register("soloRollRequest:start", handleSoloRollStart);
        info("socketlib group roll handlers registered", {
            userId: game.user?.id,
            isGm: game.user?.isGM,
        });
    } catch (err) {
        error("Failed to register socketlib handlers", err);
    }
}

export function setupGroupRollSocket() {
    info("setupGroupRollSocket() called");

    // Register on socketlib.ready in case socketlib hasn't initialized yet.
    (Hooks as any).once("socketlib.ready", () => {
        info("socketlib.ready hook fired");
        registerSocketlibHandlers();
    });

    // If socketlib is already available (e.g. we missed the ready hook because of
    // module load order), register immediately as well. registerSocketlibHandlers
    // is idempotent.
    if ((globalThis as any).socketlib?.registerModule) {
        info("socketlib already available at setup time; registering immediately");
        registerSocketlibHandlers();
    }
}

function ensureSocket(): SocketlibSocket | null {
    if (socket) return socket;
    // Last-ditch attempt to recover from a missed registration.
    if ((globalThis as any).socketlib?.registerModule) {
        warn("Socket not registered yet; attempting late registration");
        registerSocketlibHandlers();
        if (socket) return socket;
    }
    error("Group roll socket not ready; message dropped.");
    return null;
}

export interface SoloRollOptions {
    title?: string;
    characteristic?: string | null;
    skill?: string | null;
}

export async function requestSoloRoll(
    hero: { uuid: string; name: string; img: string },
    options: SoloRollOptions = {}
): Promise<void> {
    if (!game.user?.isGM) {
        warn("requestSoloRoll() must be invoked by the GM client.");
        return;
    }

    const ownerUserId = resolveOwnerUserId(hero.uuid);
    if (!ownerUserId) {
        warn("requestSoloRoll: no non-GM owner found for actor", hero.uuid);
        return;
    }

    const payload: SoloRollRequestPayload = {
        uuid: hero.uuid,
        name: hero.name,
        img: hero.img,
        title: options.title ?? "Request Roll",
        characteristic: options.characteristic ?? null,
        skill: options.skill ?? null,
    };
    const s = ensureSocket();
    if (!s) return;

    info("[SEND] soloRollRequest:start", { uuid: hero.uuid, ownerUserId, characteristic: payload.characteristic, skill: payload.skill });
    // executeForEveryone is the proven pattern; each client self-filters via ownership check.
    Promise.resolve(s.executeForEveryone("soloRollRequest:start", payload)).catch((err) =>
        error("executeForEveryone soloRollRequest:start failed", err)
    );
}

async function handleSoloRollStart(payload: SoloRollRequestPayload) {
    if (game.user?.isGM) return;

    const actor = (await safeFromUuid(payload.uuid)) as
        | (Actor & { system?: { skills?: unknown }; img?: string | null })
        | null;
    if (!actor) {
        warn("soloRollRequest: actor not found", payload.uuid);
        return;
    }

    const hasOwner = game.user ? actor.testUserPermission(game.user, "OWNER") : false;
    if (!hasOwner) return;

    info("[RECV] soloRollRequest:start", { uuid: payload.uuid, actorName: actor.name });

    // Skill: if the GM specified one, lock the player to it; otherwise show their trained skills.
    const lockedSkill = payload.skill ?? null;
    const skillOptions = lockedSkill
        ? buildSkillOptionForKey(lockedSkill)
        : buildSkillOptionsForActor(actor);

    const characteristicOptions = buildCharacteristicOptions();
    const rollType = payload.characteristic
        ? buildCharacteristicLabel(payload.characteristic) + " Test"
        : "Test";

    const result = await requestPowerRollSetup({
        title: payload.title,
        rollType,
        actorName: payload.name,
        formula: "2d10",
        modifiers: { edges: 0, banes: 0, bonuses: 0 },
        messageMode: "public",
        skill: lockedSkill,
        skillOptions,
        skillModifiers: {},
        characteristic: payload.characteristic,
        characteristicOptions,
    });

    if (!result) return;

    const modifiers = result.rolls[0];
    // Use the characteristic the player confirmed in the setup panel.
    const resolvedChar = result.characteristic ?? payload.characteristic;
    const charBonus = resolvedChar
        ? getCharacteristicBonus(actor, resolvedChar)
        : 0;
    const modifier =
        charBonus +
        toInt(modifiers.bonuses) +
        2 * toInt(modifiers.edges) -
        2 * toInt(modifiers.banes);

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
    const naturalResult = dice.reduce(
        (sum: number, d: { value: number; active: boolean }) =>
            sum + (d.active ? d.value : 0),
        0
    );
    const netBoon = toInt(modifiers.edges) - toInt(modifiers.banes);
    const tier = computeTier(total);

    const speaker = ChatMessage.getSpeaker({ actor: actor as Actor });

    let messageId: string | null = null;
    try {
        const message = await ChatMessage.create({
            speaker,
            rolls: [roll],
            flags: { [MODULE_ID]: { soloRollRequest: true } },
            flavor: `${payload.title} — Test`,
        } as any);
        messageId = (message as any)?.id ?? null;
    } catch (err) {
        warn("Failed to create solo roll request chat message", err);
    }

    if (messageId) await waitForDice(messageId);

    await showRollOverlay({
        id: foundry.utils.randomID(),
        title: payload.title,
        rollType: "Test",
        actorName: payload.name,
        formula: formatRollFormula(dice, modifier, total),
        messageId: messageId ?? "",
        partId: "solo-request",
        rollIndex: 0,
        flavor: "Test",
        actorImg: actor.img ?? undefined,
        dice,
        total,
        naturalResult,
        modifier,
        tier: String(tier),
        netBoon,
        isCritical: false,
        isNat20: false,
        authorId: game.user?.id ?? null,
        user: game.user!,
        nativeRoll: roll,
        visibility: result.messageMode === "gmroll" ? "obfuscated" : "visible",
        speaker,
    });
}

function buildCharacteristicOptions(): { value: string; label: string }[] {
    const chars = (globalThis as any).ds?.CONFIG?.characteristics as
        | Record<string, { label: string }>
        | undefined;
    if (!chars) return [];
    return Object.entries(chars).map(([value, cfg]) => ({
        value,
        label: localizeMaybe(cfg.label),
    }));
}

function buildSkillOptionForKey(skillKey: string): { value: string; label: string; group?: string }[] {
    const list = (globalThis as any).ds?.CONFIG?.skills?.list as
        | Record<string, { label: string; group?: string }>
        | undefined;
    const groups = (globalThis as any).ds?.CONFIG?.skills?.groups as
        | Record<string, { label: string }>
        | undefined;
    const cfg = list?.[skillKey];
    if (!cfg) return [{ value: skillKey, label: skillKey }];
    const groupKey = cfg.group;
    const label = localizeMaybe(cfg.label);
    const group = groupKey && groups?.[groupKey]
        ? localizeMaybe(groups[groupKey].label)
        : undefined;
    return [{ value: skillKey, label, group }];
}

function buildCharacteristicLabel(charKey: string): string {
    const chars = (globalThis as any).ds?.CONFIG?.characteristics as
        | Record<string, { label: string }>
        | undefined;
    const cfg = chars?.[charKey];
    if (!cfg) return charKey;
    return localizeMaybe(cfg.label);
}

function getCharacteristicBonus(
    actor: Actor & { system?: unknown },
    charKey: string
): number {
    const system = (actor as any).system;
    if (!system) return 0;
    // Try the most common Draw Steel data shapes.
    const charData = system?.characteristics?.[charKey];
    if (typeof charData === "number") return charData;
    if (typeof charData?.value === "number") return charData.value;
    if (typeof charData?.score === "number") return charData.score;
    return 0;
}

function resolveOwnerUserId(actorUuid: string): string | null {
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

export function broadcastGroupRollStart(payload: GroupStartPayload) {
    info("[SEND] groupRoll:start", {
        groupId: payload.groupId,
        participantCount: payload.participants.length,
        from: game.user?.id,
        isGm: game.user?.isGM,
        socketReady: !!socket,
    });
    const s = ensureSocket();
    if (s) {
        Promise.resolve(s.executeForEveryone("groupRoll:start", payload)).catch((err) =>
            error("executeForEveryone groupRoll:start failed", err)
        );
    }
    handleGroupRollStart(payload);
}

export function broadcastGroupRollReady(payload: GroupReadyPayload) {
    info("[SEND] groupRoll:ready (broadcast)", {
        groupId: payload.groupId,
        actorUuid: payload.actorUuid,
        from: game.user?.id,
        socketReady: !!socket,
    });
    const s = ensureSocket();
    if (s) {
        Promise.resolve(s.executeForEveryone("groupRoll:ready", payload)).catch((err) =>
            error("executeForEveryone groupRoll:ready failed", err)
        );
    }
    handleGroupRollReady(payload);
}

export function broadcastGroupParticipantRolling(payload: GroupParticipantRollingPayload) {
    info("[SEND] groupRoll:participantRolling", {
        groupId: payload.groupId,
        actorUuid: payload.actorUuid,
        socketReady: !!socket,
    });
    const s = ensureSocket();
    if (s) {
        Promise.resolve(s.executeForEveryone("groupRoll:participantRolling", payload)).catch(
            (err) => error("executeForEveryone groupRoll:participantRolling failed", err)
        );
    }
    handleGroupParticipantRolling(payload);
}

export function broadcastGroupParticipantResolved(
    payload: GroupParticipantResolvedPayload
) {
    info("[SEND] groupRoll:participantResolved", {
        groupId: payload.groupId,
        actorUuid: payload.actorUuid,
        socketReady: !!socket,
    });
    const s = ensureSocket();
    if (s) {
        Promise.resolve(s.executeForEveryone("groupRoll:participantResolved", payload)).catch(
            (err) => error("executeForEveryone groupRoll:participantResolved failed", err)
        );
    }
    handleGroupParticipantResolved(payload);
}

export function broadcastGroupRollCancel(payload: GroupCancelPayload) {
    info("[SEND] groupRoll:cancel", {
        groupId: payload.groupId,
        socketReady: !!socket,
    });
    const s = ensureSocket();
    if (s) {
        Promise.resolve(s.executeForEveryone("groupRoll:cancel", payload)).catch((err) =>
            error("executeForEveryone groupRoll:cancel failed", err)
        );
    }
    handleGroupRollCancel(payload);
}

export function handleGroupRollStart(payload: GroupStartPayload) {
    const isGm = !!game.user?.isGM;
    activeGroupStarts.set(payload.groupId, payload);

    info("[RECV] groupRoll:start", {
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
    info("openOwnedParticipantSetups: scanning participants", {
        groupId: payload.groupId,
        myUserId: game.user?.id,
        participants: payload.participants.length,
    });
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

        info("openSoloSetupIfOwned: permission check", {
            groupId: payload.groupId,
            actorUuid: participant.uuid,
            actorName: actor.name,
            myUserId: game.user?.id,
            isGm: game.user?.isGM,
            hasOwnerPermission,
        });

        if (!hasOwnerPermission || game.user?.isGM) {
            startedSetupParticipants.delete(setupKey);
            info("openSoloSetupIfOwned: skipping (no owner permission or GM)", {
                groupId: payload.groupId,
                actorUuid: participant.uuid,
            });
            return;
        }

        const isMontage = payload.metadata?.feature === "montage";
        const difficultyOptions = isMontage ? MONTAGE_DIFFICULTY_OPTIONS : undefined;
        const initialDifficulty = isMontage
            ? (typeof payload.metadata?.difficulty === "string"
                  ? payload.metadata.difficulty
                  : "medium")
            : null;

        const lockedSkill =
            typeof payload.metadata?.skill === "string" ? payload.metadata.skill : null;
        const skillOptions = lockedSkill
            ? buildSkillOptionForKey(lockedSkill)
            : buildSkillOptionsForActor(actor);

        const charKey =
            typeof payload.metadata?.characteristic === "string"
                ? payload.metadata.characteristic
                : null;
        const rollType = charKey
            ? buildCharacteristicLabel(charKey) + " Test"
            : payload.rollType;

        info("openSoloSetupIfOwned: opening roll configuration UI", {
            groupId: payload.groupId,
            actorUuid: participant.uuid,
            skillOptionCount: skillOptions.length,
            isMontage,
            characteristic: charKey,
            skill: lockedSkill,
        });

        const characteristicOptions = buildCharacteristicOptions();

        const result = await requestPowerRollSetup({
            title: payload.title,
            rollType,
            actorName: participant.name,
            formula: "2d10",
            modifiers: { edges: 0, banes: 0, bonuses: 0 },
            messageMode: "public",
            skill: lockedSkill,
            skillOptions,
            skillModifiers: {},
            difficulty: initialDifficulty,
            difficultyOptions,
            characteristic: charKey,
            characteristicOptions,
        });

        if (!result) return;

        const config = promptResultToConfig(result);
        closeSubmittedPowerRollSetup();
        joinedGroupIds.add(payload.groupId);
        showGroupRollOverlay(payload);
        broadcastGroupRollReady({
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
    system?: { skills?: any };
}): { value: string; label: string; group?: string }[] {
    // Draw Steel actors store trained skills in `system.skills.value` (a Set).
    // The parent `system.skills` is a schema object — using it directly returns
    // unrelated keys ("value", etc.) instead of the actor's trained skills.
    const skills = actor?.system?.skills?.value ?? actor?.system?.skills;
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
        difficulty: result.difficulty ?? null,
        characteristic: result.characteristic ?? null,
    };
}

export function handleGroupRollReady(payload: GroupReadyPayload) {
    info("[RECV] groupRoll:ready", {
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

export function handleGroupParticipantRolling(payload: GroupParticipantRollingPayload) {
    info("[RECV] groupRoll:participantRolling", {
        groupId: payload.groupId,
        actorUuid: payload.actorUuid,
        userId: game.user?.id,
        isGm: game.user?.isGM,
    });
    useGroupRollStore.getState().setRolling(payload.actorUuid);
}

export function handleGroupParticipantResolved(
    payload: GroupParticipantResolvedPayload
) {
    info("[RECV] groupRoll:participantResolved", {
        groupId: payload.groupId,
        actorUuid: payload.actorUuid,
        userId: game.user?.id,
        isGm: game.user?.isGM,
    });
    useGroupRollStore
        .getState()
        .setResolved(payload.actorUuid, payload.result);
}

export function handleGroupRollCancel(payload: GroupCancelPayload) {
    info("[RECV] groupRoll:cancel", { groupId: payload.groupId });
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

export async function rollForParticipant(
    groupId: string,
    participant: { uuid: string; name: string; img: string }
): Promise<void> {
    if (!game.user?.isGM) return;

    const startPayload = activeGroupStarts.get(groupId);
    if (!startPayload) {
        warn("rollForParticipant: no active group start found", groupId);
        return;
    }

    const actor = (await safeFromUuid(participant.uuid)) as
        | (Actor & { system?: { skills?: any } })
        | null;

    const isMontage = startPayload.metadata?.feature === "montage";
    const difficultyOptions = isMontage ? MONTAGE_DIFFICULTY_OPTIONS : undefined;
    const initialDifficulty = isMontage
        ? typeof startPayload.metadata?.difficulty === "string"
            ? startPayload.metadata.difficulty
            : "medium"
        : null;

    const lockedSkill =
        typeof startPayload.metadata?.skill === "string"
            ? startPayload.metadata.skill
            : null;
    const skillOptions = lockedSkill
        ? buildSkillOptionForKey(lockedSkill)
        : actor
        ? buildSkillOptionsForActor(actor)
        : [];

    const charKey =
        typeof startPayload.metadata?.characteristic === "string"
            ? startPayload.metadata.characteristic
            : null;
    const rollType = charKey
        ? buildCharacteristicLabel(charKey) + " Test"
        : startPayload.rollType;

    const characteristicOptions = buildCharacteristicOptions();

    const result = await requestPowerRollSetup({
        title: startPayload.title,
        rollType,
        actorName: participant.name,
        formula: "2d10",
        modifiers: { edges: 0, banes: 0, bonuses: 0 },
        messageMode: "public",
        skill: lockedSkill,
        skillOptions,
        skillModifiers: {},
        difficulty: initialDifficulty,
        difficultyOptions,
        characteristic: charKey,
        characteristicOptions,
    });

    if (!result) return;

    const config = promptResultToConfig(result);
    closeSubmittedPowerRollSetup();
    broadcastGroupRollReady({
        groupId,
        actorUuid: participant.uuid,
        config,
    });
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
        metadata: payload.metadata,
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

        broadcastGroupParticipantRolling({
            groupId,
            actorUuid: participant.uuid,
        });

        try {
            const charKey =
                typeof data.metadata?.characteristic === "string"
                    ? data.metadata.characteristic
                    : null;
            const result = await rollParticipant(participant.uuid, participant.config, data.title, charKey);

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
                tier: result.view.tier ?? 1,
                product: result.view.tier ?? 1,
                difficulty: participant.config.difficulty ?? null,
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
    groupTitle: string,
    characteristicKey?: string | null
): Promise<{ view: GroupParticipantResult; messageId: string | null }> {
    const actor = await safeFromUuid(uuid);
    // Prefer the characteristic the player confirmed in their setup panel; fall back to GM's choice.
    const resolvedCharKey = config.characteristic ?? characteristicKey ?? null;
    const charBonus =
        resolvedCharKey && actor
            ? getCharacteristicBonus(
                  actor as Actor & { system?: unknown },
                  resolvedCharKey
              )
            : 0;
    const modifier =
        charBonus + toInt(config.bonuses) + 2 * toInt(config.edges) - 2 * toInt(config.banes);

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
    const tier = computeTier(total);

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
            tier,
            difficulty: config.difficulty ?? null,
            formula: formatRollFormula(dice, modifier, total),
        },
        messageId,
    };
}

function computeTier(total: number): number {
    if (total <= 11) return 1;
    if (total <= 16) return 2;
    return 3;
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
