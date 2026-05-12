import { MODULE_ID } from "@/config/constants";
import { useHookEvent } from "@/hooks/use-hook-event";
import {
    getOverlaySetupLayout,
    OverlaySetupLayout,
} from "@/settings/overlay";
import {
    DrawSteelRollOverlayData,
    DrawSteelRollResultOverlayData,
    DrawSteelRollSetupOverlayData,
    useRollOverlayStore,
} from "@/stores/roll-overlay-store";
import React, { useEffect, useState } from "react";
import { useGsapToggle } from "../../hooks/use-gsap-toggle";
import { RollOverlayInfo } from "./roll-overlay-info";
import { RollOverlayPlayerRoll } from "./roll-overlay-player-roll";
import { RollOverlaySetupPanel } from "./roll-overlay-setup-panel";

export const RollOverlay: React.FC = () => {
    const current = useRollOverlayStore((s) => s.current);
    const shouldShow = useRollOverlayStore((s) => s.shouldShow);
    const resultsRevealed = useRollOverlayStore((s) => s.resultsRevealed);
    const cancelSetup = useRollOverlayStore((s) => s.cancelSetup);

    const [phase, setPhase] = useState<"hidden" | "visible">("hidden");
    const [setupLayout, setSetupLayout] =
        useState<OverlaySetupLayout>(getOverlaySetupLayout());

    useHookEvent(`${MODULE_ID}.setupLayout`, setSetupLayout);

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

    useEffect(() => {
        if (current?.phase !== "setup") return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") cancelSetup();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [cancelSetup, current?.phase]);

    return (
        <>
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
                <div className="flex flex-col items-center justify-center text-center gap-[1.5em]">
                    <RollOverlayInfo
                        data={current}
                        resultsRevealed={resultsRevealed}
                        ref={elementRef}
                    />
                    {current &&
                        isSetupOverlay(current) &&
                        setupLayout === "panel" && (
                            <div className="flex flex-row justify-center items-center">
                                <div className="mx-[4px]">
                                    <RollOverlaySetupPanel
                                        key={`${current.id}-setup-panel`}
                                        data={current}
                                        isVisible={shouldShow}
                                    />
                                </div>
                            </div>
                        )}
                    {current && isResultOverlay(current) && (
                        <div className="flex flex-row justify-center items-center">
                            <div className="mx-[4px]">
                                <RollOverlayPlayerRoll
                                    key={current.id}
                                    data={current}
                                    isVisible={shouldShow}
                                    resultsRevealed={resultsRevealed}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

function isResultOverlay(
    data: DrawSteelRollOverlayData
): data is DrawSteelRollResultOverlayData {
    return data.phase === "resolved" || data.phase === "obfuscated";
}

function isSetupOverlay(
    data: DrawSteelRollOverlayData
): data is DrawSteelRollSetupOverlayData {
    return data.phase === "setup" || data.phase === "rolling";
}
