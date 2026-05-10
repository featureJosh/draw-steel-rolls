import { Dnd5eAdapter } from "./dnd";
import { Pf2eAdapter } from "./pf2e";
import { ShadowdarkAdapter } from "./shadowdark";

export function getAdapter() {
    if (game.system.id === "dnd5e") return Dnd5eAdapter;
    if (game.system.id === "pf2e") return Pf2eAdapter;
    if (game.system.id === "shadowdark") return ShadowdarkAdapter;
    throw new Error();
}
