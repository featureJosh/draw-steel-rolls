export function getModifierFromRoll(roll: Roll): number {
    //@ts-expect-error protected
    const evaluated: Roll.Evaluated<Roll> = roll._evaluated
        ? roll
        : roll.evaluateSync();

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
    return modified[maxIndex] - dice[maxIndex];
}
