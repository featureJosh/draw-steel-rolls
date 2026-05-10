import { Dice3D, DiceBox, DiceFactory, DSNMesh } from "@/types/dsn";
import { faceQuats, getDice3d, getFaceQuaternion } from "@/utils/dsn";

class DiceBoxManager {
    private static _instance: DiceBoxManager;
    private box: DiceBox | null = null;
    private factory: DiceFactory | null = null;
    private meshes: Map<string, DSNMesh> = new Map();

    static get instance() {
        if (!DiceBoxManager._instance) {
            DiceBoxManager._instance = new DiceBoxManager();
        }
        return DiceBoxManager._instance;
    }

    async init(canvasContainer: HTMLElement) {
        if (this.box) return;

        const DiceBoxCtor = getDice3d().box.constructor;
        const DiceFactoryCtor = getDice3d().box.dicefactory.constructor;
        //@ts-expect-error
        this.factory = new DiceFactoryCtor();

        const config = foundry.utils.deepClone(getDice3d().box.config);
        config.scale = 75;
        config.autoscale = false;
        config.boxType = "shared-dice-box";

        //@ts-expect-error
        this.box = new DiceBoxCtor(
            canvasContainer,
            this.factory,
            config
        ) as DiceBox;
        await this.box.initialize();

        // attach resize observer
        const resize = () => {
            if (!this.box) return;
            this.box.setScene({
                width: canvasContainer.clientWidth,
                height: canvasContainer.clientHeight,
            });

            this.box.renderScene();
        };

        window.addEventListener("resize", resize);

        const observer = new ResizeObserver(resize);
        observer.observe(canvasContainer);
    }

    private pending: Map<string, Promise<DSNMesh>> = new Map();

    async spawnDie(
        id: string,
        type: keyof typeof faceQuats,
        user: User,
        pos: { x: number; y: number }
    ) {
        if (!this.box) throw new Error("Box not initialized");
        if (!this.factory) throw new Error("Factory not initialized");
        if (this.meshes.has(id) || this.pending.has(id)) return;

        const p = (async () => {
            const appearance = getAppearance(user, type, this.factory!);
            const dicemesh = (await this.factory!.create(
                this.box!.renderer.scopedTextureCache,
                type,
                appearance
            )) as DSNMesh;

            if (dicemesh.material) {
                if (Array.isArray(dicemesh.material)) {
                    dicemesh.material = dicemesh.material.map((m) => m.clone());
                } else {
                    dicemesh.material = dicemesh.material.clone();
                }
            }

            dicemesh.notation = { type };
            dicemesh.quaternion.copy(getFaceQuaternion(type, 1));
            dicemesh.result = 1;
            dicemesh.position.set(pos.x, pos.y, 0);

            this.box!.scene.add(dicemesh);
            this.box!.diceList.push(dicemesh);

            this.meshes.set(id, dicemesh);
            this.pending.delete(id);

            this.box!.renderScene();
            return dicemesh;
        })();

        this.pending.set(id, p);
        return p;
    }

    updatePosition(id: string, pos: { x: number; y: number }) {
        const mesh = this.meshes.get(id);
        if (mesh) {
            mesh.position.set(pos.x, pos.y, 0);
            this.box?.renderScene();
        }
    }

    async removeDie(id: string) {
        if (this.pending.has(id)) {
            try {
                const mesh = await this.pending.get(id)!;
                this.pending.delete(id);
                this._actuallyRemoveDie(id, mesh);
            } catch {
                this.pending.delete(id);
            }
            return;
        }

        const mesh = this.meshes.get(id);
        if (mesh) {
            this._actuallyRemoveDie(id, mesh);
        }
    }

    private _actuallyRemoveDie(id: string, mesh: DSNMesh) {
        if (!this.box) return;
        this.box.scene.remove(mesh);
        this.box.diceList = this.box.diceList.filter((m) => m !== mesh);
        this.meshes.delete(id);
        this.box.renderScene();
    }

    getDie(id: string): DSNMesh | undefined {
        return this.meshes.get(id);
    }

    getBox(): DiceBox | null {
        return this.box;
    }

    getFactory(): DiceFactory | null {
        return this.factory;
    }

    private activeAnimations = new Set<string>();
    private rafId: number | null = null;

    startAnimating(id: string) {
        this.activeAnimations.add(id);
        if (this.rafId) return; // loop already running

        const loop = () => {
            if (!this.box) return;
            this.box.renderScene();

            if (this.activeAnimations.size > 0) {
                this.rafId = requestAnimationFrame(loop);
            } else {
                this.rafId = null;
            }
        };

        this.rafId = requestAnimationFrame(loop);
    }

    stopAnimating(id: string) {
        this.activeAnimations.delete(id);
        if (this.activeAnimations.size === 0 && this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
            this.box?.renderScene(); // final render snap
        }
    }
}

export const diceBoxManager = DiceBoxManager.instance;

export function getAppearance(
    user: User,
    type: keyof typeof faceQuats,
    factory: DiceFactory
) {
    const dsnConfig = (
        getDice3d().constructor as typeof Dice3D
    ).ALL_CUSTOMIZATION(user, factory);
    return factory.getAppearanceForDice(dsnConfig.appearance, type);
}
