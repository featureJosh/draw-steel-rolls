import { parseDND5E } from "./dnd";
import { parsePF2E } from "./pf2e";

/** A generic metadata interface the orchestrator can use */
export interface RollMeta {
    category: string; // e.g. “skill”, “attack”, “save”
    subcategory?: string; // e.g. “Stealth” if it’s a skill
    target?: number; // DC or target number, if any
    rollType?: string; // advantage/disadvantage etc.
}

export type ParserInput = { flavor?: string; html?: JQuery<HTMLElement> };

type ParserFn = (input: ParserInput) => RollMeta | null;

const PARSERS: Record<string, ParserFn> = {
    dnd5e: parseDND5E,
    pf2e: parsePF2E,
};

const defaultParser: ParserFn = () => {
    return null;
};

/** Central dispatcher */
export function parseRollMeta(chatMessage: ChatMessage): RollMeta | null {
    const sys = game.system?.id;
    if (!sys) return null;

    const parser = PARSERS[sys] ?? defaultParser;
    return parser({ flavor: chatMessage.flavor });
}
