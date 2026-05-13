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
                        <SetupCardSummary data={data} />
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

const SetupCardSummary: React.FC<{ data: DrawSteelRollSetupOverlayData }> = ({
    data,
}) => {
    const submitSetup = useRollOverlayStore((s) => s.submitSetup);
    const disabled = data.phase === "rolling";

    return (
        <>
            <button
                type="button"
                className={cn(
                    "pointer-events-auto absolute left-1/2 top-[176px] flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/45 bg-black/78 text-[34px] text-white shadow-[0_0_28px_rgba(255,255,255,0.18),inset_0_0_18px_rgba(255,255,255,0.06)] transition hover:bg-white/12 disabled:pointer-events-none disabled:opacity-70",
                    disabled && "animate-pulse"
                )}
                onClick={submitSetup}
                disabled={disabled}
                data-tooltip={disabled ? "Rolling" : "Roll"}
            >
                <i className="fa-solid fa-diamond" />
            </button>

            <div className="w-[220px] absolute font-black text-[13px] uppercase tracking-normal left-1/2 top-[235px] -translate-x-1/2 -translate-y-1/2">
                {disabled
                    ? "Rolling"
                    : formatResultBoon(data.modifiers.edges - data.modifiers.banes)}
            </div>

            <div
                className="w-[220px] absolute font-semibold text-[18px] left-1/2 top-[282px] -translate-x-1/2 -translate-y-1/2 invisible"
                aria-hidden
            >
                Tier 0
            </div>
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

const MEDIA_VIDEO_REGEX = /\.(mp4|webm|ogg)$/i;

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
