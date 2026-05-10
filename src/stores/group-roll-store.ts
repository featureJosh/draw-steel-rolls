import { diceBoxManager, getAppearance } from "@/managers/dice-box-manager";
import { MaterialData } from "@/types/dsn";
import { getDiceOffsetCoordinates } from "@/utils/dice-offset-coordinates";
import { rotateToResult } from "@/utils/dsn";
import { sleep } from "@/utils/general";
import { deserialize } from "@/utils/serialize";
import { Material } from "three";
import { create } from "zustand";

interface RollResult {
    actorUuid: ActorUuid;
    result: number[];
    modified: number[];
    maxIndex: number;
}

interface RollState {
    current: InitiatedGroupRoll | null;
    shouldShow: boolean;

    results: Record<ActorUuid, RollResult>;

    show: (roll: InitiatedGroupRoll) => void;
    hide: () => void;
    diceIdsByActor: Record<ActorUuid, string[]>;
    addDiceId: (actorUuid: ActorUuid, id: string) => void;
    removeDiceId: (actorUuid: ActorUuid, id: string) => void;
    clearDice: () => void;

    setResult: (actorUuid: ActorUuid, result: RollResult) => void;
    clearResults: () => void;

    canvasVisible: boolean;
    setCanvasVisible: (visible: boolean) => void;
    showCanvas: () => void;
    hideCanvas: () => void;
}

export const useRollStore = create<RollState>((set) => ({
    current: null,
    shouldShow: false,
    diceIdsByActor: {},
    results: {},

    show: (roll) => set({ current: roll, shouldShow: true }),
    hide: () => set({ shouldShow: false }),

    addDiceId: (actorUuid, id) =>
        set((s) => {
            const current = s.diceIdsByActor[actorUuid] ?? [];
            return {
                diceIdsByActor: {
                    ...s.diceIdsByActor,
                    [actorUuid]: [...current, id],
                },
            };
        }),

    removeDiceId: (actorUuid, id) =>
        set((s) => {
            const current = s.diceIdsByActor[actorUuid] ?? [];
            return {
                diceIdsByActor: {
                    ...s.diceIdsByActor,
                    [actorUuid]: current.filter((d) => d !== id),
                },
            };
        }),

    clearDice: () => set({ diceIdsByActor: {} }),

    setResult: (actorUuid, result) =>
        set((s) => ({ results: { ...s.results, [actorUuid]: result } })),
    clearResults: () => set({ results: {} }),

    canvasVisible: false,
    setCanvasVisible: (visible) => set({ canvasVisible: visible }),
    showCanvas: () => set({ canvasVisible: true }),
    hideCanvas: () => set({ canvasVisible: false }),
}));

const EMPTY_ARRAY: string[] = [];

function getDieOffsets(n: number): number[] {
    if (n === 1) return [0];
    if (n === 2) return [-128, 128];

    const arr: number[] = [];
    const mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
        arr.push((i - mid) * 256);
    }
    return arr;
}

export function setupGroupRollHooks() {
    let dieCounter = 0;
    Hooks.on("showGroupRollRequest", async (incoming: InitiatedGroupRoll) => {
        const existingIds = Object.values(
            useRollStore.getState().diceIdsByActor
        ).flat();
        existingIds.forEach((id) => diceBoxManager.removeDie(id));
        useRollStore.getState().clearDice();

        useRollStore.getState().clearResults();

        const rolls = incoming.rolls;
        const offsets = getDieOffsets(rolls.length);
        await Promise.all(
            rolls.map(async (r, i) => {
                const actor = r.actor;
                const actorUuid = actor.uuid as ActorUuid;
                const user: User =
                    game.users?.find((u) => u.character?.uuid === actorUuid) ??
                    game.users?.find((u) => u.isGM) ??
                    game.user!;

                dieCounter += 1;

                const numberOfDie = r.advantageMode + 1;

                const baseY = -405;
                const baseX = offsets[i];

                let maxIndex: number | null = null;
                let dice: number[] = [];

                //@ts-expect-error protected
                if (r.roll._evaluated) {
                    const raw = r.roll.dice[0]?.results ?? [];
                    dice = raw.map((r) => r.result);

                    maxIndex = raw.reduce((best, r, idx, arr) => {
                        if (!r.active) return best;
                        if (best < 0) return idx;
                        return r.result! > arr[best]!.result! ? idx : best;
                    }, -1);
                }

                for (let i = 0; i < numberOfDie; i++) {
                    dieCounter += 1;
                    const id = `${incoming.id}-${actorUuid}-${i}`;
                    const genId = `${id}-${dieCounter}`;

                    const { top, left } = getDiceOffsetCoordinates(
                        i,
                        numberOfDie
                    );
                    const screenPos = {
                        x: baseX + left * 2,
                        y: baseY + top * 2,
                    };

                    const mesh = await diceBoxManager.spawnDie(
                        genId,
                        "d20",
                        user,
                        screenPos
                    );

                    if (mesh?.material) {
                        const mat = mesh.material as Material & {
                            opacity?: number;
                            transparent?: boolean;
                        };
                        if ("opacity" in mat) {
                            mat.transparent = true;
                            mat.opacity = 0;
                        }
                    }

                    const diceFactory = diceBoxManager.getFactory();

                    if (mesh && maxIndex === i && diceFactory) {
                        const user: User =
                            game.users?.find(
                                (u) => u.character?.uuid === actor.uuid
                            ) ??
                            game.users?.find((u) => u.isGM) ??
                            game.user!;

                        const appearance = getAppearance(
                            user,
                            "d20",
                            diceFactory
                        );

                        // Recreate the dice object
                        let base = diceFactory.getPresetBySystem(
                            "d20",
                            appearance.system
                        );

                        if (!base) return;

                        const diceobj = {
                            ...base,
                            labels: [...base.labels],
                        };

                        const result = dice[i];
                        const faceIndex = result + 1;
                        const newValue = r.roll.total ?? 1;

                        if (
                            faceIndex >= 0 &&
                            faceIndex < diceobj.labels.length
                        ) {
                            diceobj.labels[faceIndex] = newValue.toString();
                        }

                        let oldMaterialData: MaterialData;
                        if (Array.isArray(mesh.material)) {
                            oldMaterialData =
                                mesh.material[0].userData?.materialData;
                        } else {
                            oldMaterialData =
                                mesh.material.userData?.materialData;
                        }

                        const materialData = diceFactory.generateMaterialData(
                            diceobj,
                            appearance
                        );

                        if (oldMaterialData) {
                            // Preserve colors
                            materialData.foreground =
                                oldMaterialData.foreground ??
                                materialData.foreground;
                            materialData.background =
                                oldMaterialData.background ??
                                materialData.background;
                            materialData.outline =
                                oldMaterialData.outline ?? materialData.outline;
                            materialData.edge =
                                oldMaterialData.edge ?? materialData.edge;

                            materialData.material =
                                oldMaterialData.material ??
                                materialData.material;

                            // Preserve font / scale / ghost state
                            materialData.font =
                                oldMaterialData.font ?? materialData.font;
                            materialData.fontScale =
                                oldMaterialData.fontScale ??
                                materialData.fontScale;
                            materialData.isGhost =
                                oldMaterialData.isGhost ?? materialData.isGhost;
                        }

                        // Create new cache key (must be unique to force refresh)
                        let baseMaterialCacheString = foundry.utils.randomID();

                        const scopedTextureCache =
                            diceBoxManager.getBox()!.renderer
                                .scopedTextureCache;

                        // Create new material
                        let newMaterial = diceFactory.createMaterial(
                            scopedTextureCache,
                            baseMaterialCacheString,
                            diceobj,
                            materialData
                        );

                        const processed = diceFactory.systems
                            .get(appearance.system)
                            ?.processMaterial("d20", newMaterial, appearance);

                        if (processed) newMaterial = processed;

                        if (Array.isArray(mesh.material)) {
                            newMaterial.onBeforeCompile =
                                mesh.material[0].onBeforeCompile;
                        } else {
                            newMaterial.onBeforeCompile =
                                mesh.material.onBeforeCompile;
                        }

                        mesh.userData.modifierMaterial = newMaterial;
                    }

                    if (mesh) {
                        useRollStore.getState().addDiceId(actorUuid, genId);
                        mesh.userData.baseDomY = screenPos.y;
                        mesh.userData.baseDomX = screenPos.x;
                    }
                }
            })
        );
        await sleep(2000);
        useRollStore.getState().setCanvasVisible(true);
        useRollStore.getState().show(incoming);
    });

    Hooks.on("hideGroupRollRequest", () => {
        useRollStore.getState().hide();
    });

    Hooks.on("setRollForEveryone", async (data) => {
        const unserialized = await deserialize<SetRollForEveryoneArgs>(data);
        const { groupRollId, actor, value, maxIndex } = unserialized;

        if (groupRollId === useRollStore.getState().current?.id) {
            useRollStore.getState().setResult(actor.uuid as ActorUuid, {
                actorUuid: actor.uuid as ActorUuid,
                result: value.result,
                modified: value.modified,
                maxIndex,
            });

            const diceIds =
                useRollStore.getState().diceIdsByActor[
                    actor.uuid as ActorUuid
                ] ?? EMPTY_ARRAY;

            diceIds.forEach((d, i) => {
                const mesh = diceBoxManager.getDie(d);
                if (mesh) {
                    rotateToResult(mesh, value.result[i] ?? 1);
                }
            });
        }
    });
}
