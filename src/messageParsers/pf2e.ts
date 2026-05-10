import { debug } from "@/utils/logging";
import { ParserInput, RollMeta } from "./_message-parser";

export function parsePF2E(input: ParserInput): RollMeta | null {
    const flavor = input.flavor;
    if (!flavor) return null;

    // Wrap in a temporary container so we can query it
    const $dom = $(`<div>${flavor}</div>`);

    // Extract only the <strong> inside the .action header
    const headerText = $dom.find("h4.action strong").first().text().trim();
    if (!headerText) return null;

    if (/^Initiative\b/i.test(headerText)) {
        return { category: "Initiative" };
    }

    debug(headerText);

    const saveMatch = /^([A-Za-z]+)\s+Saving\s+Throw$/i.exec(headerText);
    if (saveMatch) {
        const save = saveMatch[1].trim();
        return {
            category: `${save} Saving Throw`,
            subcategory: save,
        };
    }

    const skillMatch = /^(.+)\s+Check$/i.exec(headerText);
    if (skillMatch) {
        const skill = skillMatch[1].trim();
        return {
            category: `${skill} Check`,
            subcategory: skill,
        };
    }

    return null;
}
