import { MODULE_ID } from "@/config/constants";
import { useHookEvent } from "@/hooks/use-hook-event";
import { cn } from "@/lib/utils";
import {
    DrawSteelRollOverlayData,
    DrawSteelRollResultOverlayData,
    DrawSteelRollSetupOverlayData,
    useRollOverlayStore,
} from "@/stores/roll-overlay-store";
import { forwardRef, useMemo, useState } from "react";
import { RollOverlayBg } from "../svg/roll-overlay-bg";

interface Props {
    data: DrawSteelRollOverlayData | null;
    resultsRevealed: boolean;
}

type MessageModeOption = {
    key: string;
    icon: string;
    tooltip: string;
    shortLabel: string;
};

export const RollOverlayInfo = forwardRef<HTMLDivElement, Props>(
    ({ data, resultsRevealed }, ref) => {
        const [color, setColor] = useState<string | undefined>(
            game.settings!.get(MODULE_ID, "border-color") ?? "#ffffff"
        );

        useHookEvent(`${MODULE_ID}.border-color`, (value) => {
            if (value) setColor(value);
        });

        const prompt = useMemo(() => buildResultPrompt(data, resultsRevealed), [
            data,
            resultsRevealed,
        ]);

        const isVideo = MEDIA_VIDEO_REGEX.test(prompt.img);
        const maskStyle = {
            maskImage: `url('/modules/${MODULE_ID}/assets/roll-overlay-mask.svg')`,
            maskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskImage: `url('/modules/${MODULE_ID}/assets/roll-overlay-mask.svg')`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
        };

        return (
            <div
                className="flex items-center justify-center text-center"
                ref={ref}
            >
                {prompt.img &&
                    (isVideo ? (
                        <video
                            className="absolute z-10 opacity-60 w-[352px] h-[395px] object-cover"
                            style={maskStyle}
                            src={prompt.img}
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            className="absolute z-10 opacity-60 w-[352px] h-[395px] object-cover"
                            style={maskStyle}
                            src={prompt.img}
                            alt=""
                        />
                    ))}
                <div className="absolute text-white z-[11] h-[340px] w-[300px]">
                    <div className="w-[230px] absolute font-semibold text-[14px] uppercase tracking-normal left-1/2 top-[48px] -translate-x-1/2 -translate-y-1/2 opacity-80 truncate">
                        {prompt.actorName}
                    </div>
                    <div className="w-[230px] absolute font-bold text-[28px] left-1/2 top-[86px] -translate-x-1/2 -translate-y-1/2 leading-none">
                        {prompt.title}
                    </div>
                    <div className="w-[220px] absolute font-semibold text-[13px] uppercase tracking-normal left-1/2 top-[124px] -translate-x-1/2 -translate-y-1/2 opacity-80">
                        {prompt.rollType}
                    </div>

                    {data && isSetupOverlay(data) ? (
                        <SetupCardControls data={data} />
                    ) : (
                        <ResultCardContent prompt={prompt} />
                    )}
                </div>

                <RollOverlayBg
                    className="drop-shadow-[0px_10px_20px_rgba(0,0,0,0.5)]"
                    stroke={color}
                    fill={color}
                    style={{ color }}
                />
            </div>
        );
    }
);

RollOverlayInfo.displayName = "RollOverlayInfo";

const SetupCardControls: React.FC<{ data: DrawSteelRollSetupOverlayData }> = ({
    data,
}) => {
    const adjustModifier = useRollOverlayStore((s) => s.adjustSetupModifier);
    const setSkill = useRollOverlayStore((s) => s.setSetupSkill);
    const setMessageMode = useRollOverlayStore((s) => s.setSetupMessageMode);
    const submitSetup = useRollOverlayStore((s) => s.submitSetup);
    const cancelSetup = useRollOverlayStore((s) => s.cancelSetup);
    const disabled = data.phase === "rolling";
    const modes = useMessageModes();
    const hasSkills = data.skillOptions.length > 0;

    return (
        <>
            <button
                type="button"
                className="pointer-events-auto absolute right-[26px] top-[36px] flex h-7 w-7 items-center justify-center rounded-sm border border-white/25 bg-black/45 text-[14px] text-white/80 transition hover:bg-white/15 disabled:opacity-35"
                onClick={cancelSetup}
                disabled={disabled}
                data-tooltip="Cancel"
            >
                <i className="fa-solid fa-xmark" />
            </button>

            <div className="absolute left-1/2 top-[166px] grid w-[240px] -translate-x-1/2 -translate-y-1/2 grid-cols-2 gap-2">
                <CardModifierControl
                    label="Edges"
                    value={data.modifiers.edges}
                    tone="edge"
                    disabled={disabled}
                    onIncrement={() => adjustModifier("edges", 1)}
                    onDecrement={() => adjustModifier("edges", -1)}
                />
                <CardModifierControl
                    label="Banes"
                    value={data.modifiers.banes}
                    tone="bane"
                    disabled={disabled}
                    onIncrement={() => adjustModifier("banes", 1)}
                    onDecrement={() => adjustModifier("banes", -1)}
                />
            </div>

            <div className="absolute left-1/2 top-[207px] grid w-[240px] -translate-x-1/2 -translate-y-1/2 grid-cols-[30px_1fr_30px] items-center gap-1.5">
                <SmallStepButton
                    label="+"
                    disabled={disabled}
                    onClick={() => adjustModifier("bonuses", 1)}
                    tooltip="Increase bonus"
                />
                <button
                    type="button"
                    className="pointer-events-auto h-8 rounded-sm border border-white/22 bg-black/62 px-2 text-center font-black leading-none shadow-[inset_0_0_16px_rgba(255,255,255,0.04)] transition hover:bg-white/8 disabled:opacity-35"
                    disabled={disabled}
                    onClick={() => adjustModifier("bonuses", 1)}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        if (!disabled) adjustModifier("bonuses", -1);
                    }}
                    data-tooltip="Left click increases, right click decreases"
                >
                    <span className="align-middle text-[9px] uppercase text-white/58">
                        Bonuses/Penalties
                    </span>
                    <span className="ml-1.5 align-middle text-[20px] text-white">
                        {formatSigned(data.modifiers.bonuses)}
                    </span>
                </button>
                <SmallStepButton
                    label="-"
                    disabled={disabled}
                    onClick={() => adjustModifier("bonuses", -1)}
                    tooltip="Decrease bonus"
                />
            </div>

            {hasSkills && (
                <label className="pointer-events-auto absolute left-1/2 top-[246px] flex w-[240px] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-sm border border-white/16 bg-black/48 px-2 py-1 text-left">
                    <span className="text-[9px] font-black uppercase text-white/55">
                        Skill
                    </span>
                    <select
                        className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold normal-case text-white outline-none"
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

            <div
                className={cn(
                    "absolute left-1/2 grid w-[240px] -translate-x-1/2 -translate-y-1/2 grid-cols-4 gap-1",
                    hasSkills ? "top-[277px]" : "top-[254px]"
                )}
            >
                {modes.map((mode) => (
                    <CardVisibilityButton
                        key={mode.key}
                        mode={mode}
                        isSelected={data.messageMode === mode.key}
                        isDisabled={disabled}
                        onClick={() => setMessageMode(mode.key)}
                    />
                ))}
            </div>

            <button
                type="button"
                className={cn(
                    "pointer-events-auto absolute left-1/2 flex h-10 w-[210px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-3 rounded-[3px] border border-orange-300/70 bg-black/62 text-[15px] font-black uppercase tracking-[0.24em] text-orange-100 shadow-[0_0_20px_rgba(255,136,0,0.16),inset_0_0_18px_rgba(255,255,255,0.04)] transition hover:bg-orange-300/12 disabled:opacity-45",
                    hasSkills ? "top-[320px]" : "top-[302px]"
                )}
                onClick={submitSetup}
                disabled={disabled}
            >
                <span className="text-[12px]">◆</span>
                Roll
            </button>
        </>
    );
};

const ResultCardContent: React.FC<{
    prompt: ReturnType<typeof buildResultPrompt>;
}> = ({ prompt }) => (
    <>
        <div className="absolute left-1/2 top-[176px] -translate-x-1/2 -translate-y-1/2">
            <div className="font-black text-[52px] leading-none">
                {prompt.total}
            </div>
        </div>
        <div className="w-[220px] absolute font-black text-[13px] uppercase tracking-normal left-1/2 top-[235px] -translate-x-1/2 -translate-y-1/2">
            {prompt.boon}
        </div>
        <div className="w-[220px] absolute font-semibold text-[18px] left-1/2 top-[282px] -translate-x-1/2 -translate-y-1/2">
            {prompt.tier}
        </div>
    </>
);

const CardModifierControl: React.FC<{
    label: string;
    value: number;
    tone: "edge" | "bane";
    disabled: boolean;
    onIncrement: () => void;
    onDecrement: () => void;
}> = ({ label, value, tone, disabled, onIncrement, onDecrement }) => {
    const isEdge = tone === "edge";

    return (
        <div
            className={cn(
                "grid h-8 grid-cols-[26px_1fr_26px] overflow-hidden rounded-sm border bg-black/45",
                isEdge ? "border-emerald-300/55" : "border-rose-300/55"
            )}
        >
            <MiniButton
                label="-"
                disabled={disabled}
                onClick={onDecrement}
            />
            <button
                type="button"
                className={cn(
                    "pointer-events-auto flex items-center justify-center gap-1.5 border-x text-center transition disabled:opacity-35",
                    isEdge
                        ? "border-emerald-300/25 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20"
                        : "border-rose-300/25 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20"
                )}
                disabled={disabled}
                onClick={onIncrement}
                onContextMenu={(event) => {
                    event.preventDefault();
                    if (!disabled) onDecrement();
                }}
                data-tooltip="Left click increases, right click decreases"
            >
                <span className="text-[9px] font-black uppercase text-white/68">
                    {label}
                </span>
                <span className="text-[22px] font-black leading-none text-white">
                    {value}
                </span>
            </button>
            <MiniButton
                label="+"
                disabled={disabled}
                onClick={onIncrement}
            />
        </div>
    );
};

const CardVisibilityButton: React.FC<{
    mode: MessageModeOption;
    isSelected: boolean;
    isDisabled: boolean;
    onClick: () => void;
}> = ({ mode, isSelected, isDisabled, onClick }) => (
    <button
        type="button"
        className={cn(
            "pointer-events-auto flex h-8 items-center justify-center gap-1 rounded-sm border text-[9px] font-black uppercase transition disabled:opacity-35",
            isSelected
                ? "border-orange-300/80 bg-orange-300/16 text-orange-100 shadow-[0_0_12px_rgba(255,136,0,0.14)]"
                : "border-white/18 bg-black/46 text-white/86 hover:bg-white/10"
        )}
        disabled={isDisabled}
        onClick={onClick}
        data-tooltip={mode.tooltip}
    >
        <i className={mode.icon} />
        <span>{mode.shortLabel}</span>
    </button>
);

const MiniButton: React.FC<{
    label: string;
    disabled: boolean;
    onClick: () => void;
}> = ({ label, disabled, onClick }) => (
    <button
        type="button"
        className="pointer-events-auto flex items-center justify-center bg-white/10 text-[15px] font-black text-white/78 transition hover:bg-white/18 disabled:opacity-35"
        disabled={disabled}
        onClick={onClick}
    >
        {label}
    </button>
);

const SmallStepButton: React.FC<{
    label: string;
    disabled: boolean;
    onClick: () => void;
    tooltip: string;
}> = ({ label, disabled, onClick, tooltip }) => (
    <button
        type="button"
        className="pointer-events-auto flex h-8 w-[30px] items-center justify-center rounded-sm border border-white/22 bg-white/12 text-[15px] font-black text-white/78 transition hover:bg-white/20 disabled:opacity-35"
        disabled={disabled}
        onClick={onClick}
        data-tooltip={tooltip}
    >
        {label}
    </button>
);

const MEDIA_VIDEO_REGEX = /\.(mp4|webm|ogg)$/i;
const HIDDEN_MESSAGE_MODES = new Set(["ic"]);

function buildResultPrompt(data: DrawSteelRollOverlayData | null, resultsRevealed: boolean) {
    if (!data) {
        return {
            img: "",
            actorName: "",
            title: "",
            rollType: "",
            tier: "",
            total: "",
            boon: "",
        };
    }

    if (!isResultOverlay(data)) {
        return {
            img: data.background,
            actorName: data.actorName,
            title: data.title || "Power Roll",
            rollType: data.rollType,
            tier: data.phase === "rolling" ? "Rolling" : "",
            total: data.phase === "rolling" ? "..." : "",
            boon: "",
        };
    }

    const hidden = data.phase === "obfuscated";
    const tier = !resultsRevealed
        ? "Rolling"
        : hidden
        ? "Tier ?"
        : data.product
        ? `${data.isCritical ? "Critical " : ""}Tier ${data.product}`
        : "";

    return {
        img: data.background,
        actorName: data.actorName,
        title: data.title || "Power Roll",
        rollType: data.rollType,
        tier,
        total: resultsRevealed ? (hidden ? "??" : String(data.total)) : "...",
        boon: resultsRevealed
            ? hidden
                ? "Edges/Banes ??"
                : formatResultBoon(data.netBoon)
            : "Rolling",
    };
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

function isSetupOverlay(
    data: DrawSteelRollOverlayData
): data is DrawSteelRollSetupOverlayData {
    return data.phase === "setup" || data.phase === "rolling";
}

function isResultOverlay(
    data: DrawSteelRollOverlayData
): data is DrawSteelRollResultOverlayData {
    return data.phase === "resolved" || data.phase === "obfuscated";
}

function formatResultBoon(netBoon: number) {
    if (!netBoon) return "No Edge or Bane";

    const count = Math.abs(netBoon);
    return netBoon > 0
        ? `${count} ${count === 1 ? "Edge" : "Edges"}`
        : `${count} ${count === 1 ? "Bane" : "Banes"}`;
}

function formatSigned(value: number) {
    if (value > 0) return `+${value}`;
    return String(value);
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
