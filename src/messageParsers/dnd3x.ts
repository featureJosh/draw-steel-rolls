import { ParserInput, RollMeta } from "./_message-parser";

export function parseDND5E3X(input: ParserInput): RollMeta | null {
    const flavor = input.flavor;
    if (!flavor) return null;

    if (/initiative/i.test(flavor)) {
        return { category: "Roll Initiative" };
    }

    const skillMatch = /^(.+?)\s+Skill\s+Check\s*\(([^)]+)\)/i.exec(flavor);
    if (skillMatch) {
        const [, skillName] = skillMatch;
        return {
            category: `${skillName.trim()} Check`,
            subcategory: skillName.trim(),
        };
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
