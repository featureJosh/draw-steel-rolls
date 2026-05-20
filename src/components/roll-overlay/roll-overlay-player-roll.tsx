import { MODULE_ID } from "@/config/constants";
import { useGsapToggle } from "@/hooks/use-gsap-toggle";
import { useHookEvent } from "@/hooks/use-hook-event";
import { cn } from "@/lib/utils";
import { DrawSteelRollResultOverlayData } from "@/stores/roll-overlay-store";
import React, { useEffect, useState } from "react";
import { DieAdvantage } from "../svg/die-advantage";
import { DieDisadvantage } from "../svg/die-disadvantage";
import { DieIgnored } from "../svg/die-ignored";
import { PlayerRollBorder } from "../svg/player-roll-border";

interface RollOverlayPlayerRollProps {
    data: DrawSteelRollResultOverlayData;
    isVisible: boolean;
    resultsRevealed: boolean;
}

export const RollOverlayPlayerRoll: React.FC<RollOverlayPlayerRollProps> = ({
    data,
    isVisible,
    resultsRevealed,
}) => {
    const [color, setColor] = useState<string | undefined>(
        game.settings!.get(MODULE_ID, "border-color") ?? "#ffffff"
    );

    useHookEvent(`${MODULE_ID}.border-color`, (value) => {
        if (value) setColor(value);
    });

    const { elementRef, show, hide } = useGsapToggle({
        from: { duration: 0.75, y: 50, opacity: 0, ease: "expo.out" },
        to: { duration: 0.75, y: 0, opacity: 1 },
    });

    useEffect(() => {
        if (isVisible) show();
        else hide();
    }, [isVisible, show, hide]);

    const hidden = data.phase === "obfuscated";
    const modifier = data.modifier;
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
            className="relative flex w-[260px] min-h-[190px] flex-col items-center justify-start gap-2 px-4 pt-3 pb-4 pointer-events-auto"
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
                <PlayerRollBorder
                    className="absolute left-1/2 top-1/2 h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 opacity-90"
                    color={color}
                />
                {resultsRevealed && !hidden && modifier !== 0 && (
                    <div className="absolute right-[8px] bottom-[8px] z-20 rounded-sm border border-white/30 bg-black/80 px-1.5 py-0.5 font-black text-base">
                        {modifier > 0 ? `+${modifier}` : modifier}
                    </div>
                )}
            </div>

            <div className="flex h-5 items-center justify-center">
                {resultsRevealed && !hidden && data.product != null ? (
                    <TierBadge tier={data.product} isCritical={data.isCritical} />
                ) : (
                    <BoonLabel
                        netBoon={data.netBoon}
                        hidden={hidden}
                        isVisible={resultsRevealed}
                    />
                )}
            </div>

            <div className="max-w-full truncate text-center text-[16px] font-bold leading-none text-white z-[12]">
                {data.actorName ?? ""}
            </div>

            <div className="flex h-10 items-center justify-center gap-2 z-[13]">
                {data.dice.map((die, index) => {
                    const icon = !hidden && !die.active ? (
                        <DieIgnored className="h-[18px] w-[16px]" />
                    ) : null;

                    return (
                        <div
                            key={`${data.id}-die-${index}`}
                            className={cn(
                                "relative flex h-10 min-w-10 items-center justify-center rounded-sm border border-white/50 bg-black/75 px-2 text-[20px] font-black leading-none shadow-[0_6px_12px_rgba(0,0,0,0.35)]",
                                !resultsRevealed && "invisible",
                                !hidden && !die.active && "opacity-45 line-through"
                            )}
                            aria-hidden={!resultsRevealed}
                        >
                            {icon && (
                                <span className="absolute -left-2 -top-2 z-[15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                    {icon}
                                </span>
                            )}
                            {hidden ? "?" : die.value}
                        </div>
                    );
                })}
                <div
                    className={cn(
                        "relative flex h-10 min-w-14 items-center justify-center rounded-sm border border-white/30 bg-white/90 px-2 text-[20px] font-black leading-none text-black",
                        !resultsRevealed && "invisible"
                    )}
                    aria-hidden={!resultsRevealed}
                >
                    {resultsRevealed && !hidden && data.netBoon > 0 && (
                        <span className="absolute -left-2 -top-2 z-[15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                            <DieAdvantage className="h-[20px] w-[18px]" />
                        </span>
                    )}
                    {resultsRevealed && !hidden && data.netBoon < 0 && (
                        <span className="absolute -left-2 -top-2 z-[15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                            <DieDisadvantage className="h-[20px] w-[18px]" />
                        </span>
                    )}
                    {hidden ? "??" : data.total}
                </div>
            </div>

            <div
                className={cn(
                    "h-4 text-center text-[12px] font-semibold uppercase tracking-normal text-white/75",
                    !resultsRevealed && "invisible"
                )}
                aria-hidden={!resultsRevealed}
            >
                {hidden ? "?? + ?? = ??" : formatRollFormula(data)}
            </div>
        </div>
    );
};

const TierBadge: React.FC<{ tier: number; isCritical: boolean }> = ({ tier, isCritical }) => {
    const tone =
        tier === 3
            ? "border-emerald-300/70 bg-emerald-500/20 text-emerald-100"
            : tier === 2
            ? "border-amber-300/70 bg-amber-500/20 text-amber-100"
            : "border-rose-300/70 bg-rose-500/20 text-rose-100";

    return (
        <div
            className={cn(
                "z-[14] flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-black uppercase leading-none tracking-normal shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
                tone
            )}
        >
            <span className="h-2 w-2 rounded-full bg-white/80" />
            <span>{isCritical ? `Critical Tier ${tier}` : `Tier ${tier}`}</span>
        </div>
    );
};

const BoonLabel: React.FC<{
    netBoon: number;
    hidden: boolean;
    isVisible: boolean;
}> = ({ netBoon, hidden, isVisible }) => {
    if (hidden) {
        return (
            <div
                className={cn(
                    "z-[14] flex items-center gap-1 rounded-sm border border-white/25 bg-white/10 px-2 py-0.5 text-[11px] font-black uppercase leading-none tracking-normal text-white/85 shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
                    !isVisible && "invisible"
                )}
                aria-hidden={!isVisible}
            >
                Edges/Banes ??
            </div>
        );
    }

    const count = Math.abs(netBoon);
    const isEdge = netBoon > 0;
    const label = isEdge ? (count === 1 ? "Edge" : "Edges") : count === 1 ? "Bane" : "Banes";

    return (
        <div
            className={cn(
                "z-[14] flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-black uppercase leading-none tracking-normal shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
                (!isVisible || !netBoon) && "invisible",
                isEdge
                    ? "border-emerald-300/70 bg-emerald-500/20 text-emerald-100"
                    : "border-rose-300/70 bg-rose-500/20 text-rose-100"
            )}
            aria-hidden={!isVisible || !netBoon}
        >
            <span className={cn("h-2 w-2 rounded-full", isEdge ? "bg-emerald-300" : "bg-rose-300")} />
            <span>
                {count} {label}
            </span>
        </div>
    );
};

function formatRollFormula(data: DrawSteelRollResultOverlayData) {
    const dice = data.dice.map((die) => die.value).join(" + ");
    const modifier =
        data.modifier === 0
            ? ""
            : ` ${data.modifier > 0 ? "+" : "-"} ${Math.abs(data.modifier)}`;

    return `${dice}${modifier} = ${data.total}`;
}
