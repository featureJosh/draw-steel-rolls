import {
    getOverlayBackground,
    getOverlayDisplayDuration,
} from "@/settings/overlay";
import { create } from "zustand";

export interface DrawSteelRollDieView {
    value: number;
    active: boolean;
}

export interface DrawSteelRollOverlayData {
    id: string;
    messageId: string;
    partId: string;
    rollIndex: number;
    title: string;
    flavor: string;
    rollType: string;
    actorName: string;
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
    background: string;
    user: User;
    nativeRoll: Roll;
    speaker?: ChatMessage["speaker"];
}

interface RollOverlayState {
    current: DrawSteelRollOverlayData | null;
    shouldShow: boolean;
    resultsRevealed: boolean;
    diceIds: string[];
    canvasVisible: boolean;
    show: (roll: DrawSteelRollOverlayData, diceIds: string[]) => void;
    revealResults: () => void;
    hide: () => void;
    clear: () => void;
    hideCanvas: () => void;
}

export const useRollOverlayStore = create<RollOverlayState>((set) => ({
    current: null,
    shouldShow: false,
    resultsRevealed: false,
    diceIds: [],
    canvasVisible: false,

    show: (roll, diceIds) =>
        set({
            current: roll,
            diceIds,
            shouldShow: true,
            resultsRevealed: false,
            canvasVisible: diceIds.length > 0,
        }),

    revealResults: () => set({ resultsRevealed: true }),

    hide: () => set({ shouldShow: false }),

    clear: () =>
        set({
            current: null,
            resultsRevealed: false,
            diceIds: [],
            canvasVisible: false,
        }),

    hideCanvas: () => set({ canvasVisible: false }),
}));

type QueuedRoll = {
    data: Omit<DrawSteelRollOverlayData, "background">;
    resolve: () => void;
    reject: (error: unknown) => void;
};

const overlayQueue: QueuedRoll[] = [];
let isDrainingQueue = false;

export async function showRollOverlay(data: Omit<DrawSteelRollOverlayData, "background">) {
    return new Promise<void>((resolve, reject) => {
        overlayQueue.push({ data, resolve, reject });
        void drainOverlayQueue();
    });
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

async function playRollOverlay(data: Omit<DrawSteelRollOverlayData, "background">) {
    const startedAt = Date.now();

    useRollOverlayStore.getState().show(
        {
            ...data,
            background: getOverlayBackground(),
        },
        []
    );

    const displayDuration = getOverlayDisplayDuration();
    useRollOverlayStore.getState().revealResults();

    const elapsed = Date.now() - startedAt;
    await sleep(Math.max(0, displayDuration - elapsed));

    useRollOverlayStore.getState().hide();
    await sleep(1000);

    useRollOverlayStore.getState().clear();
}

function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
