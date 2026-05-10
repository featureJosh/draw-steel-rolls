import { diceBoxManager } from "@/managers/dice-box-manager";
import { DrawSteelRollDieView } from "@/stores/roll-overlay-store";
import gsap from "gsap";
import { useEffect } from "react";
import { Material, Quaternion, Vector3 } from "three";

export const useDiceAnimation2 = (
    diceIds: string[],
    dice: DrawSteelRollDieView[],
    rollId: string,
    modifierRef: React.RefObject<HTMLDivElement | null>
) => {
    useEffect(() => {
        const id = `dice-animation-${rollId}`;
        if (!diceIds.length) return;

        const baseQuaternions = new Map<string, Quaternion>();

        const timeline = gsap.timeline({
            onStart: () => {
                diceBoxManager.startAnimating(id);
                diceIds.forEach((dieId) => {
                    const mesh = diceBoxManager.getDie(dieId);
                    if (mesh) baseQuaternions.set(dieId, mesh.quaternion.clone());
                });
            },
            onComplete: () => diceBoxManager.stopAnimating(id),
            onInterrupt: () => diceBoxManager.stopAnimating(id),
        });
        gsap.ticker.fps(60);

        const wiggleQuaternion = new Quaternion();
        const tmpVector = new Vector3(0, 0, 1);

        diceIds.forEach((dieId, index) => {
            const mesh = diceBoxManager.getDie(dieId);
            if (!mesh) return;

            timeline.to(
                mesh.position,
                {
                    y: "+=38",
                    duration: 0.5,
                    ease: "power2.out",
                },
                index === 0 ? 0 : "<"
            );

            timeline.to(
                mesh.scale,
                {
                    x: dice[index]?.active === false ? 0.86 : 1.15,
                    y: dice[index]?.active === false ? 0.86 : 1.15,
                    z: dice[index]?.active === false ? 0.86 : 1.15,
                    duration: 0.5,
                    ease: "power3.out",
                },
                "<"
            );

            timeline.to(
                getOpacityTargets(mesh.material),
                {
                    opacity: dice[index]?.active === false ? 0.35 : 1,
                    duration: 0.5,
                },
                "<"
            );

            timeline.to(
                { wiggleT: 0 },
                {
                    wiggleT: 1,
                    duration: 0.55,
                    ease: "power2.inOut",
                    onUpdate: function () {
                        const baseQuaternion = baseQuaternions.get(dieId);
                        if (!baseQuaternion) return;
                        const t = this.targets()[0].wiggleT;
                        const wiggleAngle = Math.sin(t * Math.PI * 4) * 0.16;
                        wiggleQuaternion.setFromAxisAngle(tmpVector, wiggleAngle);
                        mesh.quaternion.copy(wiggleQuaternion).multiply(baseQuaternion);
                    },
                },
                "<"
            );
        });

        if (modifierRef.current) {
            timeline.to(modifierRef.current, {
                x: `+=5`,
                y: `+=5`,
                duration: 0.3,
                ease: "power1.in",
            });

            timeline.to(modifierRef.current, {
                x: `-=16`,
                y: `-=16`,
                opacity: 0,
                duration: 0.4,
                ease: "power3.out",
            });
        }

        timeline.pause();
        const timer = setTimeout(() => timeline.play(), 500);

        return () => {
            clearTimeout(timer);
            timeline.kill();
            diceBoxManager.stopAnimating(id);
        };
    }, [diceIds, dice, rollId]);
};

function getOpacityTargets(material: Material | Material[]) {
    const materials = Array.isArray(material) ? material : [material];
    return materials.map((mat) => {
        const target = mat as Material & {
            opacity?: number;
            transparent?: boolean;
        };
        target.transparent = true;
        return target;
    });
}
