import {
    getOverlayBackground,
    getOverlayDisplayDuration,
} from "@/settings/overlay";
import { isDebugModeEnabled } from "@/settings/debug-mode";
import { debug } from "@/utils/logging";
import { create } from "zustand";

export interface PowerRollModifiers {
    edges: number;
    banes: number;
    bonuses: number;
}

export interface PowerRollSkillOption {
    value: string;
    label: string;
    group?: string;
}

export interface PowerRollSkillModifier {
    edges?: number;
    banes?: number;
}

export interface PowerRollDifficultyOption {
    value: string;
    label: string;
}

export interface CharacteristicOption {
    value: string;
    label: string;
}

export interface PowerRollSetupPrompt {
    id: string;
    title: string;
    rollType: string;
    actorName: string;
    formula: string;
    modifiers: PowerRollModifiers;
    messageMode: string;
    skill: string | null;
    skillOptions: PowerRollSkillOption[];
    skillModifiers: Record<string, PowerRollSkillModifier>;
    difficulty?: string | null;
    difficultyOptions?: PowerRollDifficultyOption[];
    characteristic?: string | null;
    characteristicOptions?: CharacteristicOption[];
}

export interface PowerRollPromptResult {
    rolls: [PowerRollModifiers];
    skill: string | null;
    messageMode: string;
    difficulty: string | null;
    characteristic: string | null;
}

export interface DrawSteelRollDieView {
    value: number;
    active: boolean;
}

interface OverlayBase {
    id: string;
    title: string;
    rollType: string;
    actorName: string;
    formula: string;
    background: string;
    messageMode?: string;
}

export interface DrawSteelRollSetupOverlayData extends OverlayBase {
    phase: "setup" | "rolling";
    modifiers: PowerRollModifiers;
    skill: string | null;
    skillOptions: PowerRollSkillOption[];
    skillModifiers: Record<string, PowerRollSkillModifier>;
    difficulty?: string | null;
    difficultyOptions?: PowerRollDifficultyOption[];
    characteristic?: string | null;
    characteristicOptions?: CharacteristicOption[];
}

export interface DrawSteelRollResultOverlayData extends OverlayBase {
    phase: "resolved" | "obfuscated";
    messageId: string;
    partId: string;
    rollIndex: number;
    flavor: string;
    actorImg?: string;
    dice: DrawSteelRollDieView[];
    total: number;
    naturalResult: number;
    modifier: number;
    tier?: string;
    product?: number;
    netBoon: number;
    isCritical: boolean;
    isNat20: boolean;
    authorId: string | null;
    user: User;
    nativeRoll: Roll | null;
    speaker?: ChatMessage["speaker"];
}

export type DrawSteelRollOverlayData =
    | DrawSteelRollSetupOverlayData
    | DrawSteelRollResultOverlayData;

export type DrawSteelRollResultInput = Omit<
    DrawSteelRollResultOverlayData,
    "background" | "phase"
> & {
    visibility: "visible" | "obfuscated";
};

interface RollOverlayState {
    current: DrawSteelRollOverlayData | null;
    shouldShow: boolean;
    resultsRevealed: boolean;
    beginSetup: (prompt: PowerRollSetupPrompt) => void;
    adjustSetupModifier: (key: keyof PowerRollModifiers, delta: number) => void;
    setSetupSkill: (skill: string | null) => void;
    setSetupCharacteristic: (characteristic: string | null) => void;
    setSetupMessageMode: (messageMode: string) => void;
    setSetupDifficulty: (difficulty: string | null) => void;
    submitSetup: () => void;
    cancelSetup: () => void;
    setResolved: (roll: DrawSteelRollResultInput) => void;
    revealResults: () => void;
    hide: () => void;
    clear: () => void;
}

type ActivePrompt = {
    id: string;
    resolve: (result: PowerRollPromptResult | null) => void;
};

type QueuedRoll = {
    data: DrawSteelRollResultInput;
    resolve: () => void;
    reject: (error: unknown) => void;
};

const overlayQueue: QueuedRoll[] = [];
let activePrompt: ActivePrompt | null = null;
let isDrainingQueue = false;

const DICE_ANIMATION_FALLBACK_MS = 4000;
const ROLLING_OVERLAY_TIMEOUT_MS = 30000;
const EDGE_BANE_MIN = 0;
const EDGE_BANE_MAX = 2;
const HIDDEN_MESSAGE_MODES = new Set(["ic"]);

let rollingTimeoutId: number | null = null;

export const useRollOverlayStore = create<RollOverlayState>((set, get) => ({
    current: null,
    shouldShow: false,
    resultsRevealed: false,

    beginSetup: (prompt) => {
        clearRollingTimeout();
        set({
            current: {
                ...prompt,
                phase: "setup",
                background: getOverlayBackground(),
            },
            shouldShow: true,
            resultsRevealed: false,
        });
    },

    adjustSetupModifier: (key, delta) => {
        set((state) => {
            const current = state.current;
            if (!current || current.phase !== "setup") return state;

            const value = current.modifiers[key] + delta;
            const nextValue =
                key === "bonuses"
                    ? value
                    : clampInteger(value, EDGE_BANE_MIN, EDGE_BANE_MAX);

            return {
                current: {
                    ...current,
                    modifiers: {
                        ...current.modifiers,
                        [key]: nextValue,
                    },
                },
            };
        });
    },

    setSetupSkill: (skill) => {
        set((state) => {
            const current = state.current;
            if (!current || current.phase !== "setup") return state;

            const previousSkill = current.skill ?? "";
            const nextSkill = skill ?? "";
            if (previousSkill === nextSkill) return state;

            const modifiers = { ...current.modifiers };

            if (previousSkill === "" && nextSkill !== "") modifiers.bonuses += 2;
            else if (previousSkill !== "" && nextSkill === "") modifiers.bonuses -= 2;

            const previousModifiers = current.skillModifiers[previousSkill];
            if (previousModifiers) {
                modifiers.edges -= previousModifiers.edges ?? 0;
                modifiers.banes -= previousModifiers.banes ?? 0;
            }

            const nextModifiers = current.skillModifiers[nextSkill];
            if (nextModifiers) {
                modifiers.edges += nextModifiers.edges ?? 0;
                modifiers.banes += nextModifiers.banes ?? 0;
            }

            return {
                current: {
                    ...current,
                    skill: nextSkill || null,
                    modifiers: normalizeModifiers(modifiers),
                },
            };
        });
    },

    setSetupCharacteristic: (characteristic) => {
        set((state) => {
            const current = state.current;
            if (!current || current.phase !== "setup") return state;
            return { current: { ...current, characteristic: characteristic || null } };
        });
    },

    setSetupMessageMode: (messageMode) => {
        set((state) => {
            const current = state.current;
            if (!current || current.phase !== "setup") return state;

            return {
                current: {
                    ...current,
                    messageMode,
                },
            };
        });
    },

    setSetupDifficulty: (difficulty) => {
        set((state) => {
            const current = state.current;
            if (!current || current.phase !== "setup") return state;

            return {
                current: {
                    ...current,
                    difficulty: difficulty || null,
                },
            };
        });
    },

    submitSetup: () => {
        const current = get().current;
        if (!current || current.phase !== "setup") return;

        const result: PowerRollPromptResult = {
            rolls: [normalizeModifiers(current.modifiers)],
            skill: current.skill || null,
            messageMode: current.messageMode ?? getDefaultMessageMode(),
            difficulty: current.difficulty ?? null,
            characteristic: current.characteristic ?? null,
        };

        const prompt = activePrompt;
        activePrompt = null;

        set({
            current: {
                ...current,
                phase: "rolling",
                modifiers: result.rolls[0],
                skill: result.skill,
                messageMode: result.messageMode,
            },
            resultsRevealed: false,
            shouldShow: true,
        });

        startRollingTimeout();
        prompt?.resolve(result);
    },

    cancelSetup: () => {
        resolveActivePrompt(null);
        clearRollingTimeout();
        set({ shouldShow: false });
        window.setTimeout(() => get().clear(), 500);
    },

    setResolved: (roll) => {
        clearRollingTimeout();
        set({
            current: {
                ...roll,
                phase: roll.visibility === "obfuscated" ? "obfuscated" : "resolved",
                background: getOverlayBackground(),
            },
            shouldShow: true,
            resultsRevealed: false,
        });
    },

    revealResults: () => set({ resultsRevealed: true }),

    hide: () => set({ shouldShow: false }),

    clear: () => {
        clearRollingTimeout();
        set({
            current: null,
            resultsRevealed: false,
        });
    },
}));

export async function requestPowerRollSetup(
    prompt: Omit<PowerRollSetupPrompt, "id">
): Promise<PowerRollPromptResult | null> {
    resolveActivePrompt(null);

    const id = foundry.utils.randomID();

    debug("Requesting power roll setup overlay", {
        id,
        title: prompt.title,
        rollType: prompt.rollType,
        actorName: prompt.actorName,
        skillOptionCount: prompt.skillOptions.length,
        messageMode: prompt.messageMode,
    });

    return new Promise((resolve) => {
        activePrompt = { id, resolve };
        const normalizedModifiers = normalizeModifiers(prompt.modifiers);
        if (prompt.skill) {
            normalizedModifiers.bonuses += 2;
            const skillMod = prompt.skillModifiers[prompt.skill];
            if (skillMod) {
                normalizedModifiers.edges = clampInteger(
                    normalizedModifiers.edges + (skillMod.edges ?? 0),
                    EDGE_BANE_MIN,
                    EDGE_BANE_MAX
                );
                normalizedModifiers.banes = clampInteger(
                    normalizedModifiers.banes + (skillMod.banes ?? 0),
                    EDGE_BANE_MIN,
                    EDGE_BANE_MAX
                );
            }
        }
        useRollOverlayStore.getState().beginSetup({
            ...prompt,
            id,
            modifiers: normalizedModifiers,
            messageMode: normalizeMessageMode(prompt.messageMode),
        });
    });
}

export async function showRollOverlay(data: DrawSteelRollResultInput) {
    const current = useRollOverlayStore.getState().current;

    if (
        current?.phase === "rolling" &&
        data.authorId &&
        data.authorId === game.user?.id
    ) {
        await playRollOverlay(data);
        return;
    }

    return new Promise<void>((resolve, reject) => {
        overlayQueue.push({ data, resolve, reject });
        void drainOverlayQueue();
    });
}

function resolveActivePrompt(result: PowerRollPromptResult | null) {
    if (!activePrompt) return;

    const prompt = activePrompt;
    activePrompt = null;
    prompt.resolve(result);
}

async function drainOverlayQueue() {
    if (isDrainingQueue) return;
    isDrainingQueue = true;

    while (overlayQueue.length) {
        const item = overlayQueue.shift();
        if (!item) continue;

        try {
            await playRollOverlay(item.data);
            item.resolve();
        } catch (error) {
            item.reject(error);
        }
    }

    isDrainingQueue = false;
}

async function playRollOverlay(data: DrawSteelRollResultInput) {
    const startedAt = Date.now();

    useRollOverlayStore.getState().setResolved(data);

    const displayDuration = getOverlayDisplayDuration();
    await waitForDiceAnimation(data.messageId);
    useRollOverlayStore.getState().revealResults();

    // Debug mode: leave overlay up until the dev manually dismisses it
    if (isDebugModeEnabled()) return;

    const elapsed = Date.now() - startedAt;
    await sleep(Math.max(0, displayDuration - elapsed));

    useRollOverlayStore.getState().hide();
    await sleep(1000);

    useRollOverlayStore.getState().clear();
}

function startRollingTimeout() {
    clearRollingTimeout();
    rollingTimeoutId = window.setTimeout(() => {
        const current = useRollOverlayStore.getState().current;
        if (current?.phase !== "rolling") return;
        useRollOverlayStore.getState().hide();
        window.setTimeout(() => useRollOverlayStore.getState().clear(), 500);
    }, ROLLING_OVERLAY_TIMEOUT_MS);
}

function clearRollingTimeout() {
    if (rollingTimeoutId === null) return;
    window.clearTimeout(rollingTimeoutId);
    rollingTimeoutId = null;
}

function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForDiceAnimation(messageId: string) {
    const dice3d = (game as any).dice3d;
    if (!dice3d) return;

    const waitByMessageId =
        dice3d.waitFor3DAnimationByMessageID ??
        dice3d.waitFor3DAnimationByMessageId;

    if (typeof waitByMessageId === "function") {
        await withTimeout(
            Promise.resolve(waitByMessageId.call(dice3d, messageId)),
            DICE_ANIMATION_FALLBACK_MS
        );
        return;
    }

    if (typeof dice3d.waitFor3DAnimation === "function") {
        await withTimeout(
            Promise.resolve(dice3d.waitFor3DAnimation.call(dice3d)),
            DICE_ANIMATION_FALLBACK_MS
        );
        return;
    }

    await sleep(700);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | void> {
    let timeoutId: number | null = null;
    const timeoutPromise = new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(resolve, timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
    }
}

function normalizeModifiers(modifiers: Partial<PowerRollModifiers>): PowerRollModifiers {
    return {
        edges: clampInteger(modifiers.edges ?? 0, EDGE_BANE_MIN, EDGE_BANE_MAX),
        banes: clampInteger(modifiers.banes ?? 0, EDGE_BANE_MIN, EDGE_BANE_MAX),
        bonuses: toInteger(modifiers.bonuses ?? 0),
    };
}

function clampInteger(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, toInteger(value)));
}

function toInteger(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.trunc(value);
}

function getDefaultMessageMode() {
    return normalizeMessageMode((game.settings as any)?.get("core", "messageMode"));
}

function normalizeMessageMode(mode: unknown) {
    const value = String(mode || "public");
    return HIDDEN_MESSAGE_MODES.has(value) ? "public" : value;
}
