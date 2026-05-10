import { useRollStore } from "@/stores/group-roll-store";
import React, { useEffect, useState } from "react";
import { useGsapToggle } from "../../hooks/use-gsap-toggle";
import { DiceCanvas } from "./dice-canvas";
import { RollOverlayInfo } from "./roll-overlay-info";
import { RollOverlayPlayerRoll } from "./roll-overlay-player-roll";

export const RollOverlay: React.FC = () => {
    const current = useRollStore((s) => s.current);
    const shouldShow = useRollStore((s) => s.shouldShow);

    const [phase, setPhase] = useState<"hidden" | "visible">("hidden");

    const {
        elementRef,
        show: playShow,
        hide: playHide,
    } = useGsapToggle({
        from: { duration: 0.75, y: 50, opacity: 0, ease: "expo.out" },
        to: { duration: 0.75, y: 0, opacity: 1 },
        onShown: () => {
            setPhase("visible");
        },
        onHidden: () => {
            setPhase("hidden");
        },
    });

    const {
        elementRef: bgRef,
        show: showBg,
        hide: hideBg,
    } = useGsapToggle({
        from: { opacity: 0, ease: "expo.out" },
        to: { opacity: 0.75 },
    });

    useEffect(() => {
        if (shouldShow) {
            playShow();
            showBg();
        } else if (!shouldShow) {
            playHide();
            hideBg();
        }
    }, [shouldShow]);

    return (
        <>
            <DiceCanvas />
            <div
                ref={bgRef}
                className={`absolute left-0 top-0 inset-0 w-full h-full pointer-events-none ${
                    phase === "visible" ? "flex" : "hidden"
                } bg-black opacity-0`}
            />
            <div
                className={`absolute left-0 top-0 inset-0 w-full h-full ${
                    phase === "visible" ? "flex" : "hidden"
                } flex-col justify-center items-center font-[BeaufortforLOL] text-white`}
            >
                <div className="flex flex-col items-center justify-center text-center gap-[10px]">
                    <RollOverlayInfo data={current} ref={elementRef} />
                    <div className="flex flex-row justify-center items-center">
                        {current?.rolls?.map((rollData, index) => (
                            <div
                                key={`${current.id}.${rollData.actor.uuid}`}
                                className="mx-[4px]"
                            >
                                <RollOverlayPlayerRoll
                                    key={`${current.id}.${rollData.actor.uuid}`}
                                    requestIndex={index}
                                    actor={rollData.actor}
                                    groupRollId={current.id}
                                    advantageMode={rollData.advantageMode}
                                    isVisible={shouldShow}
                                    rollData={rollData}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
