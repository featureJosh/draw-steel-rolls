import { MODULE_ID } from "@/config/constants";
import { useDiceAnimation2 } from "@/hooks/use-dice-anim-2";
import { useGsapToggle } from "@/hooks/use-gsap-toggle";
import { useHookEvent } from "@/hooks/use-hook-event";
import { cn } from "@/lib/utils";
import { diceBoxManager } from "@/managers/dice-box-manager";
import {
    DrawSteelRollOverlayData,
    useRollOverlayStore,
} from "@/stores/roll-overlay-store";
import { getDiceOffsetCoordinates } from "@/utils/dice-offset-coordinates";
import gsap from "gsap";
import React, {
    useEffect,
    useRef,
    useState,
} from "react";
import { Material } from "three";
import { PlayerRollBorder } from "../svg/player-roll-border";

interface RollOverlayPlayerRollProps {
    data: DrawSteelRollOverlayData;
    isVisible: boolean;
}

const EMPTY_ARRAY: string[] = [];

export const RollOverlayPlayerRoll: React.FC<RollOverlayPlayerRollProps> = ({
    data,
    isVisible,
}) => {
    const [color, setColor] = useState<string | undefined>(
        game.settings!.get(MODULE_ID, "border-color") ?? "#ffffff"
    );

    useHookEvent(`${MODULE_ID}.border-color`, (value) => {
        if (value) setColor(value);
    });

    const modifier = data.modifier;

    const diceIds = useRollOverlayStore((s) => s.diceIds ?? EMPTY_ARRAY);

    const hideCanvas = useRollOverlayStore((s) => s.hideCanvas);

    const modifierRef = useRef<HTMLDivElement>(null);

    const { elementRef, show, hide } = useGsapToggle({
        from: { duration: 0.75, y: 50, opacity: 0, ease: "expo.out" },
        to: { duration: 0.75, y: 0, opacity: 1 },
        onHidden: () => {
            hideCanvas();
        },
        onUpdate: () => {
            const y = gsap.getProperty(elementRef.current, "y") as number;
            const opacity = gsap.getProperty(
                elementRef.current,
                "opacity"
            ) as number;
            diceIds.forEach((id, index) => {
                const mesh = diceBoxManager.getDie(id);
                if (mesh) {
                    const wiggleEnded = mesh.userData.wiggleEnded;

                    if (wiggleEnded) {
                        mesh.position.y =
                            mesh.userData.baseDomY -
                            Number(
                                getDiceOffsetCoordinates(index, diceIds.length)
                                    .top
                            ) *
                                2 -
                            y * 2;
                        mesh.position.x =
                            mesh.userData.baseDomX -
                            Number(
                                getDiceOffsetCoordinates(index, diceIds.length)
                                    .left
                            ) *
                                2;
                    } else {
                        mesh.position.y = mesh.userData.baseDomY - y * 2;
                    }
                }
                if (mesh?.material) {
                    const mat = mesh.material as Material & {
                        opacity?: number;
                        transparent?: boolean;
                    };
                    if ("opacity" in mat) {
                        mat.transparent = true;
                        mat.opacity = opacity;
                    }
                }
            });
        },
        withDiceBox: foundry.utils.randomID(),
    });

    useEffect(() => {
        if (isVisible) show();
        else hide();
    }, [isVisible, show, hide]);

    useDiceAnimation2(
        diceIds,
        data.dice,
        data.id,
        modifierRef
    );

    const actorMaskStyle = {
        maskImage: `url('/modules/${MODULE_ID}/assets/player-roll-border-mask.svg')`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url('/modules/${MODULE_ID}/assets/player-roll-border-mask.svg')`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
    };

    return (
        <>
            <div
                className="flex items-center justify-center relative w-[120px] h-[120px] pointer-events-auto"
            >
                <div ref={elementRef}>
                    <BoonLabel netBoon={data.netBoon} />
                    {data.actorImg && (
                        <img
                            className="absolute object-cover opacity-60 z-10"
                            style={actorMaskStyle}
                            src={data.actorImg}
                        />
                    )}
                    <PlayerRollBorder className="opacity-80" color={color} />
                    {modifier !== 0 && (
                        <div
                            ref={modifierRef}
                            className={cn(
                                "absolute top-[80px] left-[86px] -translate-x-1/2 rounded-sm font-black text-base z-20 px-0.5"
                            )}
                        >
                            {modifier > 0 ? `+${modifier}` : modifier}
                        </div>
                    )}
                    <div className="absolute left-1/2 top-[115px] -translate-x-1/2 -translate-y-1/2 text-[15px] font-bold text-center text-white z-[12]">
                        {data.actorName?.split(" ")[0] ?? ""}
                    </div>
                    <div className="absolute left-1/2 top-[138px] -translate-x-1/2 flex gap-1 z-[13]">
                        {data.dice.map((die, index) => (
                            <div
                                key={`${data.id}-die-${index}`}
                                className={cn(
                                    "h-6 min-w-6 px-1 rounded-sm border border-white/40 bg-black/70 text-xs font-black flex items-center justify-center",
                                    !die.active && "opacity-45 line-through"
                                )}
                            >
                                {die.value}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

const BoonLabel: React.FC<{ netBoon: number }> = ({ netBoon }) => {
    if (!netBoon) return null;

    const count = Math.abs(netBoon);
    const label = netBoon > 0 ? (count === 1 ? "Edge" : "Edges") : count === 1 ? "Bane" : "Banes";

    return (
        <div className="absolute left-1/2 top-[-8px] -translate-x-1/2 z-[14] rounded-sm border border-white/30 bg-black/70 px-1.5 py-0.5 text-[11px] font-black uppercase tracking-normal">
            {count} {label}
        </div>
    );
};
