const MODULE_OPTION_KEY = "drawSteelRollsStationary";
const PATCH_FLAG = "__drawSteelRollsStationaryPatch";
const LEGACY_TO_METERS = 0.016 / 50;
const SPAWN_HEIGHT_MIN = 200 * LEGACY_TO_METERS;
const SPAWN_DROP_VELOCITY = -10 * LEGACY_TO_METERS;

type StationaryOptions = {
    index: number;
    total: number;
};

type DsnDie = {
    type: string;
    vectors: unknown;
    options?: Record<string, unknown>;
};

type NotationVectors = {
    dice: DsnDie[];
};

type ThrowEngine = {
    diceScene: {
        display: {
            innerWidth: number;
            innerHeight: number;
        };
    };
    dicefactory: {
        get: (type: string) => { type: string; shape: string; inertia: number };
    };
    getVectors: (
        notationVectors: NotationVectors,
        vector: { x: number; y: number },
        boost: number,
        dist: number
    ) => NotationVectors;
    [PATCH_FLAG]?: boolean;
};

export function installStationaryDicePatch() {
    const engine = getThrowEngine();
    if (!engine || engine[PATCH_FLAG]) return;

    const originalGetVectors = engine.getVectors.bind(engine);

    engine.getVectors = function patchedGetVectors(
        notationVectors,
        vector,
        boost,
        dist
    ) {
        if (!isStationaryNotation(notationVectors)) {
            return originalGetVectors(notationVectors, vector, boost, dist);
        }

        for (const die of notationVectors.dice) {
            const diceobj = this.dicefactory.get(die.type);
            const options = die.options?.[MODULE_OPTION_KEY] as StationaryOptions;
            const offset = getStationaryOffset(options.index, options.total);

            die.vectors = {
                type: diceobj.type,
                pos: {
                    x: this.diceScene.display.innerWidth * -0.31 + offset.x,
                    y: SPAWN_HEIGHT_MIN,
                    z: this.diceScene.display.innerHeight * 0.13 + offset.z,
                },
                velocity: {
                    x: 0,
                    y: SPAWN_DROP_VELOCITY,
                    z: 0,
                },
                angle: {
                    x: diceobj.inertia * 0.9,
                    y: diceobj.inertia * 0.35,
                    z: diceobj.inertia * -0.7,
                },
                axis: {
                    x: 0,
                    y: 0,
                    z: 0,
                    a: 0,
                },
            };
        }

        return notationVectors;
    };

    engine[PATCH_FLAG] = true;
}

export function getStationaryDiceOptions(index: number, total: number) {
    return {
        [MODULE_OPTION_KEY]: {
            index,
            total,
        },
    };
}

function getThrowEngine(): ThrowEngine | null {
    return ((game as any).dice3d?.box?.throwEngine as ThrowEngine | undefined) ?? null;
}

function isStationaryNotation(notationVectors: NotationVectors) {
    return (
        notationVectors.dice.length > 0 &&
        notationVectors.dice.every((die) => !!die.options?.[MODULE_OPTION_KEY])
    );
}

function getStationaryOffset(index: number, total: number) {
    const spacing = 92 * LEGACY_TO_METERS;
    const center = (total - 1) / 2;
    return {
        x: (index - center) * spacing,
        z: 0,
    };
}
