import { asyncHooksCallAll } from "../utils/async-hooks";
import { debug } from "../utils/logging";
import { deserialize } from "../utils/serialize";
import { groupRollListener } from "./group-roll-listener";

export async function handleShowGroupRollRequest(
    data: Serialized<InitiatedGroupRoll>
) {
    const deserialized = await deserialize<InitiatedGroupRoll>(data);
    asyncHooksCallAll("showGroupRollRequest", deserialized);
}

export async function handleHideGroupRollRequest() {
    asyncHooksCallAll("hideGroupRollRequest");
}

export async function onGroupRollRequest(
    data: Serialized<InitiatedGroupRoll>
): Promise<string[]> {
    debug("onGroupRollRequest");

    const deserialized = await deserialize<InitiatedGroupRoll>(data);

    let results: Roll.Evaluated<Roll>[];

    if (deserialized.promptHeader?.toLowerCase().includes("initiative")) {
        results = await groupRollListener.manageRequest(
            deserialized,
            combatCancelRegistrar
        );
    } else {
        results = await groupRollListener.manageRequest(deserialized);
    }

    const toDataResults = results.map((r: Roll.Evaluated<Roll>) =>
        JSON.stringify(r.toJSON())
    );
    return toDataResults;
}

function combatCancelRegistrar(cleanup: () => void) {
    let hookId: number;
    const promise = new Promise<void>((resolve) => {
        hookId = Hooks.once("deleteCombat", () => {
            cleanup();
            resolve();
        });
    });
    return {
        promise,
        cleanup: () => Hooks.off("deleteCombat", hookId),
    };
}
