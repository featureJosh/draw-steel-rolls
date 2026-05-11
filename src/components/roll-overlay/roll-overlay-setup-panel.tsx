import { MODULE_ID } from "@/config/constants";
import { useGsapToggle } from "@/hooks/use-gsap-toggle";
import { useHookEvent } from "@/hooks/use-hook-event";
import { cn } from "@/lib/utils";
import {
    DrawSteelRollSetupOverlayData,
    PowerRollModifiers,
    useRollOverlayStore,
} from "@/stores/roll-overlay-store";
import React, { useEffect, useMemo, useState } from "react";

interface RollOverlaySetupPanelProps {
    data: DrawSteelRollSetupOverlayData;
    isVisible: boolean;
}

type MessageModeOption = {
    key: string;
    icon: string;
    tooltip: string;
    shortLabel: string;
};

export const RollOverlaySetupPanel: React.FC<RollOverlaySetupPanelProps> = ({
    data,
    isVisible,
}) => {
    const [color, setColor] = useState<string | undefined>(
        game.settings!.get(MODULE_ID, "border-color") ?? "#ff8a1f"
    );

    useHookEvent(`${MODULE_ID}.border-color`, (value) => {
        if (value) setColor(value);
    });

    const adjustModifier = useRollOverlayStore((s) => s.adjustSetupModifier);
    const setSkill = useRollOverlayStore((s) => s.setSetupSkill);
    const setMessageMode = useRollOverlayStore((s) => s.setSetupMessageMode);
    const submitSetup = useRollOverlayStore((s) => s.submitSetup);
    const cancelSetup = useRollOverlayStore((s) => s.cancelSetup);

    const { elementRef, show, hide } = useGsapToggle({
        from: { duration: 0.55, y: 28, opacity: 0, ease: "expo.out" },
        to: { duration: 0.55, y: 0, opacity: 1 },
    });

    useEffect(() => {
        if (isVisible) show();
        else hide();
    }, [isVisible, show, hide]);

    const modes = useMessageModes();
    const disabled = data.phase === "rolling";
    const accent = color ?? "#ff8a1f";
    const hasSkills = data.skillOptions.length > 0;

    return (
        <div
            ref={elementRef}
            className="pointer-events-auto relative w-[560px] max-w-[calc(100vw-24px)] px-8 pb-8 pt-7 text-white"
            style={{
                background:
                    "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 34%), linear-gradient(180deg, rgba(31,31,28,0.96), rgba(12,12,11,0.98))",
                border: `1px solid ${accent}`,
                boxShadow: `0 18px 46px rgba(0,0,0,0.55), 0 0 34px ${accent}26, inset 0 0 34px rgba(255,255,255,0.04)`,
                clipPath:
                    "polygon(4% 0, 96% 0, 100% 8%, 100% 92%, 96% 100%, 4% 100%, 0 92%, 0 8%)",
            }}
        >
            <PanelCorners accent={accent} />

            <button
                type="button"
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-sm border border-white/20 bg-black/35 text-[14px] text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white disabled:opacity-35"
                onClick={cancelSetup}
                disabled={disabled}
                data-tooltip="Cancel"
            >
                <i className="fa-solid fa-xmark" />
            </button>

            <div className="relative z-10 mb-7 flex flex-col items-center text-center">
                <div className="mb-1 flex w-full items-center justify-center gap-3 text-[21px] font-black uppercase leading-none text-white">
                    <span
                        className="h-px w-[118px] max-w-[22%]"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${accent})`,
                        }}
                    />
                    <span className="text-[10px]" style={{ color: accent }}>
                        ◆
                    </span>
                    <span className="max-w-[220px] truncate">
                        {data.actorName}
                    </span>
                    <span className="text-[10px]" style={{ color: accent }}>
                        ◆
                    </span>
                    <span
                        className="h-px w-[118px] max-w-[22%]"
                        style={{
                            background: `linear-gradient(90deg, ${accent}, transparent)`,
                        }}
                    />
                </div>
                <div
                    className="text-[15px] font-black uppercase tracking-[0.08em]"
                    style={{ color: accent }}
                >
                    Configure Roll
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-7">
                <PanelModifierControl
                    label="Edges"
                    value={data.modifiers.edges}
                    tone="edge"
                    disabled={disabled}
                    onIncrement={() => adjustModifier("edges", 1)}
                    onDecrement={() => adjustModifier("edges", -1)}
                />
                <PanelModifierControl
                    label="Banes"
                    value={data.modifiers.banes}
                    tone="bane"
                    disabled={disabled}
                    onIncrement={() => adjustModifier("banes", 1)}
                    onDecrement={() => adjustModifier("banes", -1)}
                />
            </div>

            <div className="relative z-10 mt-6 grid grid-cols-[62px_1fr_48px_62px] gap-3">
                <div className="flex h-[52px] items-center justify-center rounded-md border border-white/20 bg-white/8 text-[24px] text-orange-100 shadow-[inset_0_0_18px_rgba(255,255,255,0.04)]">
                    <i className="fa-solid fa-scale-balanced" />
                </div>
                <button
                    type="button"
                    className="flex h-[52px] min-w-0 items-center justify-between rounded-md border border-white/14 bg-black/42 px-5 text-left shadow-[inset_0_0_22px_rgba(255,255,255,0.035)] transition hover:border-white/28 hover:bg-white/8 disabled:opacity-40"
                    onClick={() => adjustModifier("bonuses", 1)}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        if (!disabled) adjustModifier("bonuses", -1);
                    }}
                    disabled={disabled}
                    data-tooltip="Left click increases, right click decreases"
                >
                    <span className="truncate text-[16px] font-black uppercase text-white/62">
                        Bonuses / Penalties
                    </span>
                    <span className="ml-4 shrink-0 text-[31px] font-black leading-none text-white">
                        {formatSigned(data.modifiers.bonuses)}
                    </span>
                </button>
                <PanelStepButton
                    label="-"
                    disabled={disabled}
                    onClick={() => adjustModifier("bonuses", -1)}
                    tooltip="Decrease bonus"
                />
                <PanelStepButton
                    label="+"
                    disabled={disabled}
                    onClick={() => adjustModifier("bonuses", 1)}
                    tooltip="Increase bonus"
                />
            </div>

            {hasSkills && (
                <label className="relative z-10 mt-5 flex h-[48px] items-center gap-3 rounded-md border border-white/14 bg-black/42 px-4 text-left shadow-[inset_0_0_18px_rgba(255,255,255,0.035)]">
                    <span
                        className="text-[18px]"
                        style={{ color: accent }}
                    >
                        <i className="fa-solid fa-star" />
                    </span>
                    <span className="text-[14px] font-black uppercase text-white/58">
                        Skill
                    </span>
                    <select
                        className="min-w-0 flex-1 bg-transparent text-[16px] font-bold text-white outline-none"
                        value={data.skill ?? ""}
                        disabled={disabled}
                        onChange={(event) => setSkill(event.target.value || null)}
                    >
                        <option value="">None</option>
                        {data.skillOptions.map((skill) => (
                            <option key={skill.value} value={skill.value}>
                                {skill.group
                                    ? `${skill.group}: ${skill.label}`
                                    : skill.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <div className="relative z-10 mt-6 grid grid-cols-4 gap-3">
                {modes.map((mode) => (
                    <PanelVisibilityButton
                        key={mode.key}
                        mode={mode}
                        accent={accent}
                        isSelected={data.messageMode === mode.key}
                        isDisabled={disabled}
                        onClick={() => setMessageMode(mode.key)}
                    />
                ))}
            </div>

            <button
                type="button"
                className="relative z-10 mx-auto mt-7 flex h-[58px] w-[430px] max-w-full items-center justify-center gap-6 border bg-black/42 text-[23px] font-black uppercase tracking-[0.38em] text-orange-100 shadow-[0_12px_28px_rgba(0,0,0,0.34),inset_0_0_22px_rgba(255,255,255,0.035)] transition hover:bg-orange-300/10 disabled:opacity-45"
                style={{
                    borderColor: accent,
                    clipPath:
                        "polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)",
                }}
                onClick={submitSetup}
                disabled={disabled}
            >
                <span className="text-[18px]">◆</span>
                {disabled ? "Rolling" : "Roll"}
            </button>
        </div>
    );
};

const PanelModifierControl: React.FC<{
    label: string;
    value: number;
    tone: "edge" | "bane";
    disabled: boolean;
    onIncrement: () => void;
    onDecrement: () => void;
}> = ({ label, value, tone, disabled, onIncrement, onDecrement }) => {
    const isEdge = tone === "edge";
    const borderColor = isEdge ? "border-emerald-400/55" : "border-rose-400/55";
    const textColor = isEdge ? "text-emerald-100" : "text-rose-100";
    const bgColor = isEdge ? "bg-emerald-500/12" : "bg-rose-500/12";
    const hoverColor = isEdge ? "hover:bg-emerald-500/20" : "hover:bg-rose-500/20";

    return (
        <div
            className={cn(
                "grid h-[62px] grid-cols-[58px_1fr_58px] overflow-hidden rounded-md border bg-black/42 shadow-[inset_0_0_20px_rgba(255,255,255,0.035)]",
                borderColor
            )}
        >
            <PanelStepButton
                label="-"
                disabled={disabled}
                onClick={onDecrement}
                tooltip={`Decrease ${label}`}
                compact
            />
            <button
                type="button"
                className={cn(
                    "flex min-w-0 flex-col items-center justify-center border-x transition disabled:opacity-40",
                    borderColor,
                    bgColor,
                    hoverColor,
                    textColor
                )}
                disabled={disabled}
                onClick={onIncrement}
                onContextMenu={(event) => {
                    event.preventDefault();
                    if (!disabled) onDecrement();
                }}
                data-tooltip="Left click increases, right click decreases"
            >
                <span className="text-[17px] font-black uppercase leading-none text-white/72">
                    {label}
                </span>
                <span className="mt-1 text-[34px] font-black leading-none text-white">
                    {value}
                </span>
            </button>
            <PanelStepButton
                label="+"
                disabled={disabled}
                onClick={onIncrement}
                tooltip={`Increase ${label}`}
                compact
            />
        </div>
    );
};

const PanelStepButton: React.FC<{
    label: string;
    disabled: boolean;
    onClick: () => void;
    tooltip: string;
    compact?: boolean;
}> = ({ label, disabled, onClick, tooltip, compact = false }) => (
    <button
        type="button"
        className={cn(
            "flex items-center justify-center rounded-md border border-white/18 bg-white/10 font-black text-white/78 shadow-[inset_0_0_18px_rgba(255,255,255,0.04)] transition hover:border-white/32 hover:bg-white/18 hover:text-white disabled:opacity-35",
            compact ? "h-full rounded-none text-[34px]" : "h-[52px] text-[28px]"
        )}
        disabled={disabled}
        onClick={onClick}
        data-tooltip={tooltip}
    >
        {label}
    </button>
);

const PanelVisibilityButton: React.FC<{
    mode: MessageModeOption;
    accent: string;
    isSelected: boolean;
    isDisabled: boolean;
    onClick: () => void;
}> = ({ mode, accent, isSelected, isDisabled, onClick }) => (
    <button
        type="button"
        className={cn(
            "flex h-[54px] min-w-0 items-center justify-center gap-2 rounded-md border px-2 text-[15px] font-black uppercase transition disabled:opacity-35",
            isSelected
                ? "bg-orange-300/12 text-orange-100"
                : "border-white/18 bg-black/36 text-white/82 hover:bg-white/8"
        )}
        style={isSelected ? { borderColor: accent } : undefined}
        disabled={isDisabled}
        onClick={onClick}
        data-tooltip={mode.tooltip}
    >
        <i className={mode.icon} />
        <span className="truncate">{mode.shortLabel}</span>
    </button>
);

const PanelCorners: React.FC<{ accent: string }> = ({ accent }) => (
    <>
        <span
            className="pointer-events-none absolute left-5 top-5 h-10 w-10 border-l border-t opacity-80"
            style={{ borderColor: accent }}
        />
        <span
            className="pointer-events-none absolute right-5 top-5 h-10 w-10 border-r border-t opacity-80"
            style={{ borderColor: accent }}
        />
        <span
            className="pointer-events-none absolute bottom-5 left-5 h-10 w-10 border-b border-l opacity-80"
            style={{ borderColor: accent }}
        />
        <span
            className="pointer-events-none absolute bottom-5 right-5 h-10 w-10 border-b border-r opacity-80"
            style={{ borderColor: accent }}
        />
    </>
);

const HIDDEN_MESSAGE_MODES = new Set(["ic"]);

function useMessageModes(): MessageModeOption[] {
    return useMemo(() => {
        const modes = (CONFIG.ChatMessage as any).modes ?? {};
        const entries = Object.entries(modes)
            .filter(([key]) => !HIDDEN_MESSAGE_MODES.has(key))
            .map(([key, mode]: [string, any]) => ({
                key,
                icon: mode.icon ?? fallbackIcon(key),
                tooltip: localizeMaybe(mode.label ?? key),
                shortLabel: getShortModeLabel(key),
            }));

        return entries.length > 0
            ? entries
            : [
                  {
                      key: "public",
                      icon: fallbackIcon("public"),
                      tooltip: "Public Roll",
                      shortLabel: "Public",
                  },
                  {
                      key: "gm",
                      icon: fallbackIcon("gm"),
                      tooltip: "Private GM Roll",
                      shortLabel: "GM",
                  },
                  {
                      key: "blind",
                      icon: fallbackIcon("blind"),
                      tooltip: "Blind GM Roll",
                      shortLabel: "Blind",
                  },
                  {
                      key: "self",
                      icon: fallbackIcon("self"),
                      tooltip: "Self Roll",
                      shortLabel: "Self",
                  },
              ];
    }, []);
}

function formatSigned(value: PowerRollModifiers["bonuses"]) {
    if (value > 0) return `+${value}`;
    return String(value);
}

function fallbackIcon(mode: string) {
    switch (mode) {
        case "public":
            return "fa-solid fa-globe";
        case "gm":
            return "fa-solid fa-user-shield";
        case "blind":
            return "fa-solid fa-eye-slash";
        case "self":
            return "fa-solid fa-user";
        default:
            return "fa-solid fa-dice-d10";
    }
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
