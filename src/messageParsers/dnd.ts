import { ParserInput, RollMeta } from "./_message-parser";
import { parseDND5E3X } from "./dnd3x";

export function parseDND5E(input: ParserInput): RollMeta | null {
    // @ts-expect-error untyped
    if (dnd5e.version.startsWith("3")) return parseDND5E3X(input);

    const flavor = input.flavor;
    if (!flavor) return null;

    if (/initiative/i.test(flavor)) {
        return { category: "Roll Initiative" };
    }

    const skillMatch = /([^(]+)\s*\(([^)]+)\)\s*Check/i.exec(flavor);
    if (skillMatch) {
        const [, , skill] = skillMatch;
        return { category: `${skill} Check`, subcategory: skill.trim() };
    }

    const abilityMatch = /([A-Za-z]+)\s+Ability\s+Check/i.exec(flavor);
    if (abilityMatch) {
        const ability = abilityMatch[1];
        return { category: `${ability} Check`, subcategory: ability.trim() };
    }

    const saveMatch = /([A-Za-z]+)\s+Saving\s+Throw/i.exec(flavor);
    if (saveMatch) {
        const ability = saveMatch[1].trim();
        return {
            category: `${ability} Saving Throw`,
            subcategory: ability,
        };
    }

    return null;
}
