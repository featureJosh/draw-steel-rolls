export interface DiceTermResultDSN extends foundry.dice.terms.DiceTerm.Result {
    hidden?: boolean;
}

export interface DiceTermResultsDSN extends Array<DiceTermResultDSN> {
    modifiedBy?: Set<Item>;
}

export interface DiceTermDSN extends foundry.dice.terms.DiceTerm {
    results: DiceTermResultsDSN;
}
