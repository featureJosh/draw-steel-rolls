import { DiceTermResultDSN } from "../types/rolls";

/**
 * Returns:
 *  0  = normal
 * +N  = N‐times advantage (2d20kh1 → +1, 3d20kh2 → +1, 3d20kh1 → +2, etc.)
 * -N  = N‐times disadvantage (2d20kl1 → -1, 3d20kl2 → -1, etc.)
 */
export function getAdvantageMode(passed: Roll | Roll[]): number {
    const roll = Array.isArray(passed) ? passed[0] : passed;
    // Find the first d20 term
    const dieTerm = roll.terms.find(
        (t) => t instanceof foundry.dice.terms.Die && t.faces === 20
    ) as foundry.dice.terms.Die | undefined;

    if (!dieTerm) return 0;

    const totalDice = dieTerm.number;

    if (!totalDice) throw new Error(`Invalid roll passed: ${roll}`);

    let keepHighest: number | undefined;
    let keepLowest: number | undefined;

    const nOr1 = (s: string) => (s ? parseInt(s, 10) : 1);

    for (const mod of dieTerm.modifiers) {
        if (mod.startsWith("kh")) keepHighest = nOr1(mod.slice(2));
        else if (mod.startsWith("kl")) keepLowest = nOr1(mod.slice(2));
    }

    if (keepHighest !== undefined) {
        return totalDice - keepHighest;
    }
    if (keepLowest !== undefined) {
        return -(totalDice - keepLowest);
    }
    return 0;
}

export function hideDice(roll: Roll) {
    roll.dice.forEach((d) => {
        d.results.forEach((r: DiceTermResultDSN) => (r.hidden = true));
    });
}
