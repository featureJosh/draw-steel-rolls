import { diceBoxManager } from "@/managers/dice-box-manager";
import { Dice3D, DSNMesh } from "@/types/dsn";
import gsap from "gsap";
import { Quaternion, Vector3 } from "three";

export const faceQuats = {
    d20: [
        [0.5339999999999999, 0.463, 0.6639999999999999, -0.24199999999999997],
        [
            -0.4588434086424397, 0.028064065111351025, 0.588455526689051,
            0.6651279784401829,
        ],
        [
            -0.4118285580452574, 0.7133079865422147, 0.49111273281711093,
            -0.28354406849441166,
        ],
        [
            0.7133079865422145, -0.4118285580452577, 0.28354406849441177,
            -0.4911127328171108,
        ],
        [
            0.4588434086424394, 0.028064065111350955, 0.5884555266890508,
            -0.6651279784401827,
        ],
        [
            -0.6953726265396697, 0.6953726265396695, 0.12828448955084545,
            0.12828448955084545,
        ],
        [
            0.02806406511135098, 0.45884340864243944, 0.6651279784401828,
            -0.5884555266890508,
        ],
        [
            -0.6661565618684073, -0.2371401169765731, 0.5376882147304866,
            -0.45922911900264135,
        ],
        [
            0.2545240464098283, -0.9498966729494981, 0.04695538208712882,
            0.1752398716379743,
        ],
        [
            0.38333801568772163, 0.2537258976411106, -0.17705344588997832,
            0.8702454894415127,
        ],
        [
            0.5884555266890509, -0.6651279784401828, 0.45884340864243955,
            0.02806406511135104,
        ],
        [
            -0.046955382087128954, 0.1752398716379748, 0.25452404640982823,
            0.949896672949498,
        ],
        [
            0.6954785639640274, -0.12770891537607781, 0.6952662127734243,
            -0.12885997584859127,
        ],
        [
            -0.5884555266890504, -0.6651279784401827, 0.4588434086424395,
            -0.028064065111350886,
        ],
        [
            0.12828448955084581, -0.12828448955084581, 0.6953726265396697,
            0.6953726265396695,
        ],
        [
            0.6651279784401831, 0.5884555266890512, -0.02806406511135099,
            0.4588434086424397,
        ],
        [
            0.49111273281711126, 0.28354406849441194, 0.41182855804525764,
            0.7133079865422148,
        ],
        [
            -0.28354406849441194, -0.4911127328171112, 0.7133079865422147,
            0.41182855804525775,
        ],
        [
            0.17705344588997826, 0.870245489441512, 0.3833380156877213,
            -0.2537258976411101,
        ],
        [
            -0.6954785639640274, -0.12770891537607773, 0.6952662127734243,
            0.12885997584859152,
        ],
    ],
};

export function getDice3d() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (game as any)?.dice3d as Dice3D;
}

export function getFaceQuaternion(type: keyof typeof faceQuats, value: number) {
    const table = faceQuats[type];
    if (!table) throw new Error(`No precomputed quaternions for ${type}`);
    const quat = table[value - 1];
    if (!quat) throw new Error(`No quaternion for face ${value} of ${type}`);
    return new Quaternion(quat[0], quat[1], quat[2], quat[3]);
}

/**
 * Rotate a dicemesh in the showcase so it lands on a desired face.
 */
export async function rotateToResult(
    dicemesh: DSNMesh,
    value: number
): Promise<void> {
    return new Promise((resolve) => {
        const type = dicemesh.notation.type as keyof typeof faceQuats;

        const targetQ = getFaceQuaternion(type, value);
        const startQ = dicemesh.quaternion.clone();
        const tmp = new Quaternion();

        // random spin axis
        const spinAxis = new Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        const spinTurns = 3 + Math.floor(Math.random() * 3); // 3–5 spins

        const id = foundry.utils.randomID();
        diceBoxManager.startAnimating(id);

        gsap.to(
            { t: 0 },
            {
                t: 1,
                duration: 2.5,
                ease: "power2.out",
                onUpdate() {
                    const t = this.targets()[0].t;

                    // Interpolate base orientation
                    tmp.copy(startQ).slerp(targetQ, t);

                    // Apply continuous spin on top
                    const spinQ = new Quaternion().setFromAxisAngle(
                        spinAxis,
                        Math.PI * 2 * spinTurns * t
                    );
                    dicemesh.quaternion.copy(spinQ).multiply(tmp);
                },
                onComplete() {
                    dicemesh.quaternion.copy(targetQ); // snap exact
                    dicemesh.result = value;
                    diceBoxManager.stopAnimating(id);
                    resolve();
                },
            }
        );
    });
}
