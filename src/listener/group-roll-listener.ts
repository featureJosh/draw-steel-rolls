import { MODULE_ID } from "@/config/constants";
import { broadcast } from "../socket/serialised";
import { sleep } from "../utils/general";
import { debug } from "../utils/logging";

interface GroupRollState {
    request: InitiatedGroupRoll;
    pending: Map<ActorUuid, { promise: Promise<void>; resolve(): void }>;
    results: Map<ActorUuid, Roll.Evaluated<Roll>>;
    ready: boolean;
}

type QueueEntry = {
    request: InitiatedGroupRoll;
    resolve(value: Roll.Evaluated<Roll>[]): void;
    reject(reason?: string): void;
};

type CancelRegistrar = (cleanup: () => void) => {
    promise: Promise<void>;
    cleanup(): void;
};

class GroupRollListener {
    private static _instance: GroupRollListener | null = null;

    private states = new Map<GroupRollId, GroupRollState>();
    public isBusy = false;
    private queue: QueueEntry[] = [];
    public currentGroupId: GroupRollId | null = null;

    public count = 0;

    constructor() {
        if (GroupRollListener._instance) {
            throw new Error(
                "RollListener is a singleton class and cannot be instantiated multiple times."
            );
        }
        GroupRollListener._instance = this;
    }

    static get instance() {
        if (!GroupRollListener._instance) {
            GroupRollListener._instance = new GroupRollListener();
        }
        return GroupRollListener._instance;
    }

    async manageRequest(
        request: InitiatedGroupRoll,
        registerCancel?: CancelRegistrar
    ): Promise<Roll.Evaluated<Roll>[]> {
        debug("manageRequest");

        if (this.isBusy) return this.enqueue(request);

        debug("continuing");

        this.isBusy = true;
        this.currentGroupId = request.id;
        this.count++;

        try {
            return await this.executeRequest(request, registerCancel);
        } finally {
            debug("finished");
            this.isBusy = false;
            this.currentGroupId = null;
            this.processNextInQueue();
        }
    }

    private enqueue(
        request: InitiatedGroupRoll
    ): Promise<Roll.Evaluated<Roll>[]> {
        debug("enqueue");
        return new Promise<Roll.Evaluated<Roll>[]>((resolve, reject) => {
            this.queue.push({ request, resolve, reject });
        });
    }

    private processNextInQueue() {
        debug("processNextInQueue");
        const next = this.queue.shift();
        if (!next) return;
        this.manageRequest(next.request).then(next.resolve, next.reject);
    }

    private createStateFor(request: InitiatedGroupRoll): GroupRollState {
        debug("createStateFor");
        const state: GroupRollState = {
            request: { ...request },
            pending: new Map(),
            results: new Map(),
            ready: false,
        };
        this.states.set(request.id, state);

        // pre‐seed a deferred promise for each actor
        for (const { actor } of request.rolls) {
            let resolveFn!: () => void;
            const promise = new Promise<void>((res) => (resolveFn = res));
            state.pending.set(actor.uuid as ActorUuid, {
                promise,
                resolve: resolveFn,
            });
        }

        return state;
    }

    private showOverlay(request: InitiatedGroupRoll) {
        debug("showOverlay");
        broadcast(
            "handleShowGroupRollRequest",
            request as unknown as Unserialized<InitiatedGroupRoll>
        );
    }

    private hideOverlay() {
        debug("hideOverlay");
        broadcast("handleHideGroupRollRequest");
    }

    private async executeRequest(
        request: InitiatedGroupRoll,
        registerCancel?: CancelRegistrar
    ): Promise<Roll.Evaluated<Roll>[]> {
        debug("executeRequest");

        const state = this.createStateFor(request);

        if (state.request.img) {
            const imgs = game.settings?.get(MODULE_ID, "imageOverrides") ?? {};
            imgs[state.request.id] = state.request.img;
            game.settings?.set(MODULE_ID, "imageOverrides", imgs);
        }

        let wasCancelled = false;

        const cancel = registerCancel?.(() => {
            wasCancelled = true;
            this.hideOverlay();
        });

        debug(request.img, state.request.img);

        this.showOverlay(request);

        try {
            await this.performRolls(request, state, cancel);

            if (wasCancelled) return [];

            await sleep(2000);
        } finally {
            this.hideOverlay();
            cancel?.cleanup();
            this.states.delete(request.id);
        }

        return this.collectResults(state, request);
    }

    private async performRolls(
        request: InitiatedGroupRoll,
        state: GroupRollState,
        cancel?: { promise: Promise<void>; cleanup(): void }
    ): Promise<void> {
        for (const { actor, roll } of request.rolls) {
            this.waitForSingleRoll(request.id, actor.uuid as ActorUuid, roll);
        }

        state.ready = true;

        while (state.pending.size > 0) {
            if (cancel) {
                await Promise.race([
                    Promise.all(
                        Array.from(state.pending.values(), (e) => e.promise)
                    ),
                    cancel.promise,
                ]);
            } else {
                await Promise.all(
                    Array.from(state.pending.values(), (e) => e.promise)
                );
            }
        }
    }

    private waitForSingleRoll(
        groupId: GroupRollId,
        actorUuid: ActorUuid,
        roll: Roll
    ): void {
        const state = this.states.get(groupId)!;

        // Register your hook exactly once per actor
        const hookId = Hooks.on(
            "triggerRollForActor",
            async (data: {
                groupRollId: GroupRollId;
                actorUuid: ActorUuid;
            }) => {
                debug("groupRollId", data.groupRollId, "actorUuid", actorUuid);
                debug("groupId", groupId, "actorUuid", actorUuid);
                if (
                    data.groupRollId !== groupId ||
                    data.actorUuid !== actorUuid
                )
                    return;
                Hooks.off("triggerRollForActor", hookId);

                debug("roll", roll);

                //@ts-expect-error protected
                const evaluated: Roll.Evaluated<Roll> = roll._evaluated
                    ? roll
                    : await roll.evaluate();

                const raw = evaluated.dice[0]?.results ?? [];

                const dice = raw.map((r) => r.result ?? 1);

                const maxIndex = raw.reduce((best, r, idx, arr) => {
                    if (!r.active) return best;
                    if (best < 0) return idx;
                    return r.result! > arr[best]!.result! ? idx : best;
                }, -1);

                const bonus = (evaluated.total ?? 0) - dice[maxIndex]!;
                const modified = dice.slice();
                modified[maxIndex]! += bonus;

                // Push into state and resolve the actor’s promise
                state.results.set(actorUuid, evaluated);

                broadcast("handleSetRollForEveryone", {
                    groupRollId: groupId,
                    actor: fromUuidSync<Actor>(actorUuid)! as Actor,
                    value: { result: dice, modified },
                    maxIndex,
                });

                await sleep(5000);
                state.pending.get(actorUuid)?.resolve();
                state.pending.delete(actorUuid);
            }
        );
    }

    private collectResults(
        state: GroupRollState,
        request: InitiatedGroupRoll
    ): Roll.Evaluated<Roll>[] {
        return request.rolls.map(({ actor }) => {
            const r = state.results.get(actor.uuid as ActorUuid);
            if (!r) throw new Error(`No roll result for actor ${actor.uuid}`);
            return r;
        });
    }
}

export const groupRollListener = GroupRollListener.instance;
