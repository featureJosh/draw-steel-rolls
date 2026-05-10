import { broadcast, executeAsGM } from "./socket/serialised";
import { UnserializedParam } from "./types/socket";
import { getAdvantageMode, hideDice } from "./utils/dice";
import { debug } from "./utils/logging";

export function triggerGroupRollRequest(data: InitiatedGroupRoll) {
    debug("acceptGroupRollRequest");
    return executeAsGM(
        "onGroupRollRequest",
        data as UnserializedParam<"onGroupRollRequest">
    );
}

export function hideGroupRollRequest() {
    debug("hideGroupRollRequest");
    return broadcast("handleHideGroupRollRequest");
}

// High-level helper that callers use in place of notifyGroupRollRequest:
/**
 * High-level: show the overlay, call the GM, parse back the rolls,
 * then hide the overlay. Returns one D20Roll per actor, in order.
 */
export async function requestGroupRoll(
    initiated: InitiatedGroupRoll
): Promise<Roll.Evaluated<Roll>[]> {
    debug("requestGroupRoll");

    try {
        const hydrated: InitiatedGroupRoll = {
            ...initiated,
            rolls: initiated.rolls.map((r) => ({
                ...r,
                advantageMode: getAdvantageMode(r.roll),
            })),
        };

        const raw = await triggerGroupRollRequest(hydrated);
        debug("raw", raw);
        const rolls = raw.map((json) => {
            debug("reviving from JSON", json);
            return Roll.fromJSON(json) as Roll.Evaluated<Roll>;
        });

        rolls.forEach((roll) => hideDice(roll));
        return rolls;
    } finally {
        // hideGroupRollRequest();
    }
}
