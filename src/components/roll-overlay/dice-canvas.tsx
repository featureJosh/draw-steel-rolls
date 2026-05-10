import { diceBoxManager } from "@/managers/dice-box-manager";
import { useRollStore } from "@/stores/group-roll-store";
import { debug } from "@/utils/logging";
import React, { forwardRef, useEffect, useRef } from "react";

interface DiceCanvasProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DiceCanvas = forwardRef<HTMLDivElement, DiceCanvasProps>(
    ({ className, ...rest }, ref) => {
        const innerRef = useRef<HTMLDivElement>(null);

        const isVisible = useRollStore((s) => s.canvasVisible);

        useEffect(() => {
            debug("Mounting DiceCanvas...");
            if (innerRef.current) {
                debug("Mounting DiceCanvas on:", innerRef.current);
                diceBoxManager.init(innerRef.current);
            }
        }, []);

        return (
            <div
                ref={(el) => {
                    innerRef.current = el;
                    if (typeof ref === "function") {
                        ref(el);
                    } else if (ref) {
                        (
                            ref as React.RefObject<HTMLDivElement | null>
                        ).current = el;
                    }
                }}
                id="dice-canvas"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 100,
                    visibility: isVisible ? "visible" : "hidden",
                }}
                className={className}
                {...rest}
            />
        );
    }
);

DiceCanvas.displayName = "DiceCanvas";
