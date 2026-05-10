import { diceBoxManager } from "@/managers/dice-box-manager";
import { DrawSteelRollDieView } from "@/stores/roll-overlay-store";
import { rotateToResult } from "@/utils/dsn";
import gsap from "gsap";
import { useEffect } from "react";
import { Material } from "three";

export const useDiceAnimation2 = (
    diceIds: string[],
    dice: DrawSteelRollDieView[],
    rollId: string,
    modifierRef: React.RefObject<HTMLDivElement | null>
) => {
    useEffect(() => {
        const id = `dice-animation-${rollId}`;
        if (!diceIds.length) return;

        const timeline = gsap.timeline({
            onStart: () => {
                diceBoxManager.startAnimating(id);
            },
            onComplete: () => diceBoxManager.stopAnimating(id),
            onInterrupt: () => diceBoxManager.stopAnimating(id),
        });
        gsap.ticker.fps(60);

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

            timeline.call(
                () => {
                    const value = dice[index]?.value;
                    if (value) void rotateToResult(mesh, value);
                },
                undefined,
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
