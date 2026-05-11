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
import { DieAdvantage } from "../svg/die-advantage";
import { DieDisadvantage } from "../svg/die-disadvantage";
import { DieIgnored } from "../svg/die-ignored";
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
        maskSize: "contain",
        WebkitMaskImage: `url('/modules/${MODULE_ID}/assets/player-roll-border-mask.svg')`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
    };

    return (
        <div
            ref={elementRef}
            className="relative flex w-[260px] min-h-[190px] flex-col items-center justify-start gap-2 rounded-sm border border-white/20 bg-black/45 px-4 pt-3 pb-4 shadow-[0_12px_24px_rgba(0,0,0,0.35)] pointer-events-auto"
        >
            <div className="relative flex h-[108px] w-[120px] items-center justify-center">
                {data.actorImg && (
                    <img
                        className="absolute left-1/2 top-1/2 z-10 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 object-cover object-center opacity-70"
                        style={actorMaskStyle}
                        src={data.actorImg}
                        alt=""
                    />
                )}
                <PlayerRollBorder className="absolute left-1/2 top-1/2 h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 opacity-90" color={color} />
                {modifier !== 0 && (
                    <div
                        ref={modifierRef}
                        className="absolute right-[8px] bottom-[8px] z-20 rounded-sm border border-white/30 bg-black/80 px-1.5 py-0.5 font-black text-base"
                    >
                        {modifier > 0 ? `+${modifier}` : modifier}
                    </div>
                )}
            </div>

            <BoonLabel netBoon={data.netBoon} />

            <div className="max-w-full truncate text-center text-[16px] font-bold leading-none text-white z-[12]">
                {data.actorName ?? ""}
            </div>

            <div className="flex items-center justify-center gap-2 z-[13]">
                {data.dice.map((die, index) => {
                    let icon: React.ReactNode = null;
                    if (!die.active) {
                        icon = <DieIgnored className="h-[18px] w-[16px]" />;
                    } else if (data.netBoon > 0) {
                        icon = <DieAdvantage className="h-[20px] w-[18px]" />;
                    } else if (data.netBoon < 0) {
                        icon = <DieDisadvantage className="h-[20px] w-[18px]" />;
                    }

                    return (
                        <div
                            key={`${data.id}-die-${index}`}
                            className={cn(
                                "relative flex h-10 min-w-10 items-center justify-center rounded-sm border border-white/50 bg-black/75 px-2 text-[20px] font-black leading-none shadow-[0_6px_12px_rgba(0,0,0,0.35)]",
                                !die.active && "opacity-45 line-through"
                            )}
                        >
                            {icon && (
                                <span className="absolute -left-2 -top-2 z-[15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                    {icon}
                                </span>
                            )}
                            {die.value}
                        </div>
                    );
                })}
                <div className="flex h-10 min-w-14 items-center justify-center rounded-sm border border-white/30 bg-white/90 px-2 text-[20px] font-black leading-none text-black">
                    {data.total}
                </div>
            </div>

            <div className="text-center text-[12px] font-semibold uppercase tracking-normal text-white/75">
                {data.dice.map((die) => die.value).join(" + ")}
                {data.modifier !== 0 &&
                    ` ${data.modifier > 0 ? "+" : "-"} ${Math.abs(data.modifier)}`}
                {" = "}
                {data.total}
            </div>
        </div>
    );
};

const BoonLabel: React.FC<{ netBoon: number }> = ({ netBoon }) => {
    if (!netBoon) return null;

    const count = Math.abs(netBoon);
    const isEdge = netBoon > 0;
    const label = isEdge ? (count === 1 ? "Edge" : "Edges") : count === 1 ? "Bane" : "Banes";

    return (
        <div
            className={cn(
                "z-[14] flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-black uppercase leading-none tracking-normal shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
                isEdge
                    ? "border-emerald-300/70 bg-emerald-500/20 text-emerald-100"
                    : "border-rose-300/70 bg-rose-500/20 text-rose-100"
            )}
        >
            <span className={cn("h-2 w-2 rounded-full", isEdge ? "bg-emerald-300" : "bg-rose-300")} />
            <span>
                {count} {label}
            </span>
        </div>
    );
};
