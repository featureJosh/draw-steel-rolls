import { MODULE_ID } from "@/config/constants";
import { useGsapToggle } from "@/hooks/use-gsap-toggle";
import { useHookEvent } from "@/hooks/use-hook-event";
import { cn } from "@/lib/utils";
<<<<<<< ours
import { DrawSteelRollOverlayData } from "@/stores/roll-overlay-store";
import React, { useEffect, useState } from "react";
=======
import {
    DrawSteelRollOverlayData,
    DrawSteelRollResultOverlayData,
    DrawSteelRollSetupOverlayData,
    useRollOverlayStore,
} from "@/stores/roll-overlay-store";
import React, { useEffect, useMemo, useState } from "react";
>>>>>>> theirs
import { DieAdvantage } from "../svg/die-advantage";
import { DieDisadvantage } from "../svg/die-disadvantage";
import { DieIgnored } from "../svg/die-ignored";
import { PlayerRollBorder } from "../svg/player-roll-border";

interface RollOverlayPlayerRollProps {
    data: DrawSteelRollOverlayData;
    isVisible: boolean;
    resultsRevealed: boolean;
}

<<<<<<< ours
=======
type MessageModeOption = {
    key: string;
    icon: string;
    tooltip: string;
    shortLabel: string;
};

>>>>>>> theirs
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

<<<<<<< ours
    const modifier = data.modifier;

=======
>>>>>>> theirs
    const { elementRef, show, hide } = useGsapToggle({
        from: { duration: 0.75, y: 50, opacity: 0, ease: "expo.out" },
        to: { duration: 0.75, y: 0, opacity: 1 },
    });

    useEffect(() => {
        if (isVisible) show();
        else hide();
    }, [isVisible, show, hide]);

<<<<<<< ours
=======
    if (isSetupOverlay(data)) {
        return (
            <SetupPanel
                ref={elementRef}
                data={data}
                color={color}
            />
        );
    }

    return (
        <ResolvedPanel
            ref={elementRef}
            data={data}
            color={color}
            resultsRevealed={resultsRevealed}
        />
    );
};

const SetupPanel = React.forwardRef<
    HTMLDivElement,
    { data: DrawSteelRollSetupOverlayData; color?: string }
>(({ data, color }, ref) => {
    const adjustModifier = useRollOverlayStore((s) => s.adjustSetupModifier);
    const setSkill = useRollOverlayStore((s) => s.setSetupSkill);
    const setMessageMode = useRollOverlayStore((s) => s.setSetupMessageMode);
    const submitSetup = useRollOverlayStore((s) => s.submitSetup);
    const cancelSetup = useRollOverlayStore((s) => s.cancelSetup);
    const disabled = data.phase === "rolling";
    const modes = useMessageModes();
    const accentColor = color ?? "#ff8800";

    return (
        <div
            ref={ref}
            className="pointer-events-auto relative flex w-[340px] flex-col items-stretch gap-3 overflow-hidden rounded-md border bg-[linear-gradient(180deg,rgba(8,8,8,0.96),rgba(0,0,0,0.9))] px-4 py-4 text-white shadow-[0_18px_36px_rgba(0,0,0,0.55)]"
            style={{
                borderColor: accentColor,
                boxShadow: "0 18px 36px rgba(0,0,0,0.55), 0 0 20px rgba(255,136,0,0.18)",
            }}
        >
            <div
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/80 to-transparent"
                aria-hidden
            />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-left">
                    <div className="truncate text-[15px] font-black leading-none text-white">
                        {data.actorName}
                    </div>
                    <div className="mt-1 truncate text-[10px] font-black uppercase leading-none text-white/62">
                        {data.phase === "rolling" ? "Waiting for roll result" : "Configure roll"}
                    </div>
                </div>
                <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-white/20 bg-white/14 text-[18px] text-white/85 transition hover:bg-white/22 disabled:opacity-35"
                    onClick={cancelSetup}
                    disabled={disabled}
                    data-tooltip="Cancel"
                >
                    <i className="fa-solid fa-xmark" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <ModifierButton
                    label="Edges"
                    value={data.modifiers.edges}
                    disabled={disabled}
                    tone="edge"
                    onIncrement={() => adjustModifier("edges", 1)}
                    onDecrement={() => adjustModifier("edges", -1)}
                />
                <ModifierButton
                    label="Banes"
                    value={data.modifiers.banes}
                    disabled={disabled}
                    tone="bane"
                    onIncrement={() => adjustModifier("banes", 1)}
                    onDecrement={() => adjustModifier("banes", -1)}
                />
            </div>

            <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
                <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/22 bg-white/16 text-[18px] font-black text-white transition hover:bg-white/24 disabled:opacity-35"
                    disabled={disabled}
                    onClick={() => adjustModifier("bonuses", 1)}
                    data-tooltip="Increase bonus"
                >
                    +
                </button>
                <button
                    type="button"
                    className="min-w-0 rounded-sm border border-white/22 bg-black/82 px-3 py-2 text-center font-black leading-none transition hover:bg-white/8 disabled:opacity-35"
                    disabled={disabled}
                    onClick={() => adjustModifier("bonuses", 1)}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        if (!disabled) adjustModifier("bonuses", -1);
                    }}
                    data-tooltip="Left click increases, right click decreases"
                >
                    <span className="text-[10px] uppercase text-white/55">
                        Bonuses/Penalties
                    </span>
                    <span className="ml-2 text-[22px] text-white">
                        {formatSigned(data.modifiers.bonuses)}
                    </span>
                </button>
                <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/22 bg-white/16 text-[18px] font-black text-white transition hover:bg-white/24 disabled:opacity-35"
                    disabled={disabled}
                    onClick={() => adjustModifier("bonuses", -1)}
                    data-tooltip="Decrease bonus"
                >
                    -
                </button>
            </div>

            {data.skillOptions.length > 0 && (
                <label className="flex flex-col gap-1 text-left text-[10px] font-black uppercase text-white/60">
                    Skill
                    <select
                        className="h-9 rounded-sm border border-white/22 bg-black/90 px-2 text-[13px] font-semibold normal-case text-white outline-none focus:border-orange-300"
                        value={data.skill ?? ""}
                        disabled={disabled}
                        onChange={(event) => setSkill(event.target.value || null)}
                    >
                        <option value="">None</option>
                        {data.skillOptions.map((skill) => (
                            <option key={skill.value} value={skill.value}>
                                {skill.group ? `${skill.group}: ${skill.label}` : skill.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <div className="grid grid-cols-4 gap-1">
                {modes.map((mode) => (
                    <VisibilityModeButton
                        key={mode.key}
                        isSelected={data.messageMode === mode.key}
                        isDisabled={disabled}
                        mode={mode}
                        onClick={() => setMessageMode(mode.key)}
                    />
                ))}
            </div>

            <button
                type="button"
                className="flex h-11 items-center justify-center gap-2 rounded-sm border border-white/70 bg-white/92 text-[14px] font-black uppercase text-black transition hover:bg-white disabled:opacity-45"
                onClick={submitSetup}
                disabled={disabled}
            >
                <i className="fa-solid fa-diamond text-[11px]" />
                Roll
            </button>
        </div>
    );
});

SetupPanel.displayName = "SetupPanel";

const VisibilityModeButton: React.FC<{
    mode: MessageModeOption;
    isSelected: boolean;
    isDisabled: boolean;
    onClick: () => void;
}> = ({ mode, isSelected, isDisabled, onClick }) => (
    <button
        type="button"
        className={cn(
            "flex h-10 items-center justify-center gap-1 rounded-sm border text-[10px] font-black uppercase transition disabled:opacity-35",
            isSelected
                ? "border-white bg-white text-black"
                : "border-white/18 bg-white/14 text-white hover:bg-white/22"
        )}
        disabled={isDisabled}
        onClick={onClick}
        data-tooltip={mode.tooltip}
    >
        <i className={mode.icon} />
        <span>{mode.shortLabel}</span>
    </button>
);

const ModifierButton: React.FC<{
    label: string;
    value: number;
    tone: "edge" | "bane";
    disabled: boolean;
    onIncrement: () => void;
    onDecrement: () => void;
}> = ({ label, value, tone, disabled, onIncrement, onDecrement }) => (
    <button
        type="button"
        className={cn(
            "flex h-8 items-center justify-center gap-2 rounded-sm border px-3 text-center transition disabled:opacity-35",
            tone === "edge"
                ? "border-emerald-300/70 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/28"
                : "border-rose-300/70 bg-rose-500/20 text-rose-50 hover:bg-rose-500/28"
        )}
        disabled={disabled}
        onClick={onIncrement}
        onContextMenu={(event) => {
            event.preventDefault();
            if (!disabled) onDecrement();
        }}
        data-tooltip="Left click increases, right click decreases"
    >
        <span className="text-[10px] font-black uppercase text-white/70">
            {label}
        </span>
        <span className="text-[24px] font-black leading-none text-white">{value}</span>
    </button>
);

const ResolvedPanel = React.forwardRef<
    HTMLDivElement,
    {
        data: DrawSteelRollResultOverlayData;
        color?: string;
        resultsRevealed: boolean;
    }
>(({ data, color, resultsRevealed }, ref) => {
    const hidden = data.phase === "obfuscated";
    const modifier = data.modifier;
>>>>>>> theirs
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
<<<<<<< ours
            ref={elementRef}
=======
            ref={ref}
>>>>>>> theirs
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
                <PlayerRollBorder className="absolute left-1/2 top-1/2 h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 opacity-90" color={color} />
<<<<<<< ours
                {resultsRevealed && modifier !== 0 && (
                    <div
                        className="absolute right-[8px] bottom-[8px] z-20 rounded-sm border border-white/30 bg-black/80 px-1.5 py-0.5 font-black text-base"
                    >
=======
                {resultsRevealed && !hidden && modifier !== 0 && (
                    <div className="absolute right-[8px] bottom-[8px] z-20 rounded-sm border border-white/30 bg-black/80 px-1.5 py-0.5 font-black text-base">
>>>>>>> theirs
                        {modifier > 0 ? `+${modifier}` : modifier}
                    </div>
                )}
            </div>

<<<<<<< ours
            {resultsRevealed && <BoonLabel netBoon={data.netBoon} />}
=======
            <div className="flex h-5 items-center justify-center">
                <BoonLabel
                    netBoon={data.netBoon}
                    hidden={hidden}
                    isVisible={resultsRevealed}
                />
            </div>
>>>>>>> theirs

            <div className="max-w-full truncate text-center text-[16px] font-bold leading-none text-white z-[12]">
                {data.actorName ?? ""}
            </div>

<<<<<<< ours
            <div className="flex items-center justify-center gap-2 z-[13]">
                {resultsRevealed && data.dice.map((die, index) => {
                    const icon = !die.active ? (
=======
            <div className="flex h-10 items-center justify-center gap-2 z-[13]">
                {data.dice.map((die, index) => {
                    const icon = !hidden && !die.active ? (
>>>>>>> theirs
                        <DieIgnored className="h-[18px] w-[16px]" />
                    ) : null;

                    return (
                        <div
                            key={`${data.id}-die-${index}`}
                            className={cn(
                                "relative flex h-10 min-w-10 items-center justify-center rounded-sm border border-white/50 bg-black/75 px-2 text-[20px] font-black leading-none shadow-[0_6px_12px_rgba(0,0,0,0.35)]",
<<<<<<< ours
                                !die.active && "opacity-45 line-through"
                            )}
=======
                                !resultsRevealed && "invisible",
                                !hidden && !die.active && "opacity-45 line-through"
                            )}
                            aria-hidden={!resultsRevealed}
>>>>>>> theirs
                        >
                            {icon && (
                                <span className="absolute -left-2 -top-2 z-[15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                    {icon}
                                </span>
                            )}
<<<<<<< ours
                            {die.value}
                        </div>
                    );
                })}
                {resultsRevealed && <div className="relative flex h-10 min-w-14 items-center justify-center rounded-sm border border-white/30 bg-white/90 px-2 text-[20px] font-black leading-none text-black">
                    {data.netBoon > 0 && (
=======
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
>>>>>>> theirs
                        <span className="absolute -left-2 -top-2 z-[15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                            <DieAdvantage className="h-[20px] w-[18px]" />
                        </span>
                    )}
<<<<<<< ours
                    {data.netBoon < 0 && (
=======
                    {resultsRevealed && !hidden && data.netBoon < 0 && (
>>>>>>> theirs
                        <span className="absolute -left-2 -top-2 z-[15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                            <DieDisadvantage className="h-[20px] w-[18px]" />
                        </span>
                    )}
<<<<<<< ours
                    {data.total}
                </div>}
            </div>

            {resultsRevealed && <div className="text-center text-[12px] font-semibold uppercase tracking-normal text-white/75">
                {data.dice.map((die) => die.value).join(" + ")}
                {data.modifier !== 0 &&
                    ` ${data.modifier > 0 ? "+" : "-"} ${Math.abs(data.modifier)}`}
                {" = "}
                {data.total}
            </div>}
        </div>
    );
};

const BoonLabel: React.FC<{ netBoon: number }> = ({ netBoon }) => {
    if (!netBoon) return null;
=======
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
});

ResolvedPanel.displayName = "ResolvedPanel";

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
>>>>>>> theirs

    const count = Math.abs(netBoon);
    const isEdge = netBoon > 0;
    const label = isEdge ? (count === 1 ? "Edge" : "Edges") : count === 1 ? "Bane" : "Banes";

    return (
        <div
            className={cn(
                "z-[14] flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-black uppercase leading-none tracking-normal shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
<<<<<<< ours
=======
                (!isVisible || !netBoon) && "invisible",
>>>>>>> theirs
                isEdge
                    ? "border-emerald-300/70 bg-emerald-500/20 text-emerald-100"
                    : "border-rose-300/70 bg-rose-500/20 text-rose-100"
            )}
<<<<<<< ours
=======
            aria-hidden={!isVisible || !netBoon}
>>>>>>> theirs
        >
            <span className={cn("h-2 w-2 rounded-full", isEdge ? "bg-emerald-300" : "bg-rose-300")} />
            <span>
                {count} {label}
            </span>
        </div>
    );
};
<<<<<<< ours
=======

function formatRollFormula(data: DrawSteelRollResultOverlayData) {
    const dice = data.dice.map((die) => die.value).join(" + ");
    const modifier =
        data.modifier === 0
            ? ""
            : ` ${data.modifier > 0 ? "+" : "-"} ${Math.abs(data.modifier)}`;

    return `${dice}${modifier} = ${data.total}`;
}

function formatSigned(value: number) {
    if (value > 0) return `+${value}`;
    return String(value);
}

function useMessageModes(): MessageModeOption[] {
    return useMemo(() => {
        const modes = (CONFIG.ChatMessage as any).modes ?? {};
        return Object.entries(modes)
            .filter(([key]) => !HIDDEN_MESSAGE_MODES.has(key))
            .map(([key, mode]: [string, any]) => ({
                key,
                icon: mode.icon ?? "fa-solid fa-dice-d10",
                tooltip: localizeMaybe(mode.label ?? key),
                shortLabel: getShortModeLabel(key),
            }));
    }, []);
}

const HIDDEN_MESSAGE_MODES = new Set(["ic"]);

function isSetupOverlay(
    data: DrawSteelRollOverlayData
): data is DrawSteelRollSetupOverlayData {
    return data.phase === "setup" || data.phase === "rolling";
}

function getShortModeLabel(mode: string) {
    switch (mode) {
        case "public":
            return "Public";
        case "gm":
            return "GM";
        case "blind":
            return "Blind";
        case "self":
            return "Self";
        default:
            return mode;
    }
}

function localizeMaybe(label: string) {
    return game.i18n?.has?.(label) ? game.i18n.localize(label) : label;
}
>>>>>>> theirs
