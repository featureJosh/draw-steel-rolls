import { diceBoxManager } from "@/managers/dice-box-manager";
import {
    getOverlayBackground,
    getOverlayDisplayDuration,
} from "@/settings/overlay";
import { getDiceOffsetCoordinates } from "@/utils/dice-offset-coordinates";
import { Material } from "three";
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
}

interface RollOverlayState {
    current: DrawSteelRollOverlayData | null;
    shouldShow: boolean;
    diceIds: string[];
    canvasVisible: boolean;
    show: (roll: DrawSteelRollOverlayData, diceIds: string[]) => void;
    hide: () => void;
    clear: () => void;
    hideCanvas: () => void;
}

export const useRollOverlayStore = create<RollOverlayState>((set) => ({
    current: null,
    shouldShow: false,
    diceIds: [],
    canvasVisible: false,

    show: (roll, diceIds) =>
        set({
            current: roll,
            diceIds,
            shouldShow: true,
            canvasVisible: true,
        }),

    hide: () => set({ shouldShow: false }),

    clear: () =>
        set({
            current: null,
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
    const state = useRollOverlayStore.getState();
    await Promise.all(state.diceIds.map((id) => diceBoxManager.removeDie(id)));

    const diceIds: string[] = [];
    const baseY = -405;
    const offsets = getDieOffsets(data.dice.length);

    await Promise.all(
        data.dice.map(async (die, index) => {
            const id = `${data.id}-${index}-${foundry.utils.randomID()}`;
            const { top, left } = getDiceOffsetCoordinates(index, data.dice.length);
            const mesh = await diceBoxManager
                .spawnDie(id, "d10", data.user, {
                    x: offsets[index] + left * 2,
                    y: baseY + top * 2,
                })
                .catch(() => undefined);

            if (!mesh) return;
            mesh.result = die.value;
            mesh.userData.baseDomX = offsets[index] + left * 2;
            mesh.userData.baseDomY = baseY + top * 2;
            mesh.userData.rollValue = die.value;
            mesh.userData.active = die.active;
            setMaterialOpacity(mesh.material, 0);
            diceIds.push(id);
        })
    );

    useRollOverlayStore.getState().show(
        {
            ...data,
            background: getOverlayBackground(),
        },
        diceIds
    );

    const displayDuration = getOverlayDisplayDuration();
    await sleep(displayDuration);

    useRollOverlayStore.getState().hide();
    await sleep(1000);

    const ids = useRollOverlayStore.getState().diceIds;
    await Promise.all(ids.map((id) => diceBoxManager.removeDie(id)));
    useRollOverlayStore.getState().clear();
}

function getDieOffsets(n: number): number[] {
    if (n <= 1) return [0];
    if (n === 2) return [-128, 128];

    const arr: number[] = [];
    const mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) arr.push((i - mid) * 192);
    return arr;
}

function setMaterialOpacity(material: Material | Material[], opacity: number) {
    const materials = Array.isArray(material) ? material : [material];
    materials.forEach((mat) => {
        const transparentMat = mat as Material & {
            opacity?: number;
            transparent?: boolean;
        };
        if ("opacity" in transparentMat) {
            transparentMat.transparent = true;
            transparentMat.opacity = opacity;
        }
    });
}

function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
