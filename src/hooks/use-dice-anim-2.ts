import { diceBoxManager } from "@/managers/dice-box-manager";
import { overrideDieFaceLabel } from "@/utils/override-face";
import gsap from "gsap";
import { useEffect } from "react";
import { Quaternion, Vector3 } from "three";
import { getDiceOffsetCoordinates } from "../utils/dice-offset-coordinates";

export const useDiceAnimation2 = (
    diceIds: string[],
    maxIndex: number | null,
    numberOfDie: number,
    groupRollId: GroupRollId,
    actor: Actor,
    configs: {
        id: string;
        result: number;
        modified: number;
    }[],
    modifierRef: React.RefObject<HTMLDivElement | null>
) => {
    const actorUuid = actor.uuid;
    useEffect(() => {
        const id = `dice-animation-${groupRollId}-${actorUuid}`;
        if (maxIndex === null) return;
        if (maxIndex < 0 || !diceIds.length) return;

        let baseQuaternion: Quaternion;

        const timeline = gsap.timeline({
            onStart: () => {
                diceBoxManager.startAnimating(id);
                const targetMesh = diceBoxManager.getDie(diceIds[maxIndex]);
                if (targetMesh) {
                    baseQuaternion = targetMesh.quaternion.clone();
                }
            },
            onComplete: () => diceBoxManager.stopAnimating(id),
            onInterrupt: () => diceBoxManager.stopAnimating(id),
        });
        gsap.ticker.fps(60);

        const checkMesh = () => {
            const id = diceIds[maxIndex];
            return diceBoxManager.getDie(id);
        };

        const targetMesh = checkMesh();
        if (!targetMesh) {
            return;
        }

        const wiggleQuaternion = new Quaternion();

        // Wiggle axis (you can choose any axis)
        const tmpVector = new Vector3(0, 0, 1);

        // Animate the "winning" die
        timeline
            .to(targetMesh.position, {
                y: `+=40`,
                duration: 0.5,
            })
            .to(
                targetMesh.scale,
                {
                    x: 1.2,
                    y: 1.2,
                    z: 1.2,
                    duration: 0.5,
                    ease: "power3.out",
                },
                "<"
            )
            .to(
                { wiggleT: 0 },
                {
                    delay: 0.35,
                    wiggleT: 1,
                    duration: 0.5,
                    yoyo: true,
                    ease: "power2.inOut",
                    onUpdate: function () {
                        const t = this.targets()[0].wiggleT;

                        const wiggleAngle = Math.sin(t * Math.PI * 4) * 0.2;

                        // Create wiggle quaternion (screen-space Z axis)
                        wiggleQuaternion.setFromAxisAngle(
                            tmpVector,
                            wiggleAngle
                        );

                        // Apply wiggle FIRST, then base rotation
                        targetMesh.quaternion
                            .copy(wiggleQuaternion)
                            .multiply(baseQuaternion);
                    },
                },
                "<"
            )
            .to(targetMesh.position, {
                y: `-=${
                    Number(
                        getDiceOffsetCoordinates(maxIndex, diceIds.length).top
                    ) *
                        2 +
                    40
                }`,
                x: `-=${
                    Number(
                        getDiceOffsetCoordinates(maxIndex, diceIds.length).left
                    ) * 2
                }`,
                duration: 0.7,
                onComplete: () => {
                    targetMesh.userData.wiggleEnded = true;
                },
            });

        // Animate the others fading out / shrinking
        diceIds.forEach((id, index) => {
            if (index === maxIndex) return;
            const mesh = diceBoxManager.getDie(id);
            if (!mesh) return;

            timeline.to(
                mesh.material,
                {
                    opacity: 0,
                    duration: 0.7,
                    onStart: () => {
                        (Array.isArray(mesh.material)
                            ? mesh.material
                            : [mesh.material]
                        ).forEach((m) => {
                            m.transparent = true;
                        });
                    },
                    onComplete: () => {
                        mesh.userData.wiggleEnded = true;
                    },
                },
                "<"
            );

            timeline.to(mesh.scale, { x: 0, y: 0, z: 0, duration: 0.7 }, "<");
        });

        if (modifierRef.current) {
            timeline.to(modifierRef.current, {
                x: `+=5`, // move right
                y: `+=5`, // move down
                duration: 0.3,
                ease: "power1.in",
            });

            timeline.to(modifierRef.current, {
                x: `-=20`, // left
                y: `-=20`, // up
                opacity: 0,
                duration: 0.4,
                ease: "power3.out",
            });

            timeline.to(
                targetMesh.position,
                {
                    y: "+=8",
                    x: "-=8",
                    duration: 0.4,
                    delay: 0.1,
                    ease: "power2.out",
                    onStart: () => {
                        overrideDieFaceLabel(
                            targetMesh,
                            "d20",
                            actor,
                            configs[maxIndex].result + 1,
                            configs[maxIndex].modified.toString()
                        );
                    },
                },
                "<"
            );

            timeline.to(targetMesh.position, {
                y: "-=8",
                x: "+=8",
                duration: 0.4,
                ease: "back.out(2)",
            });
        }

        timeline.pause();
        const timer = setTimeout(() => timeline.play(), 4000);

        return () => {
            clearTimeout(timer);
            timeline.kill();
            diceBoxManager.stopAnimating(id);
        };
    }, [diceIds, maxIndex, numberOfDie, groupRollId, actor]);
};
