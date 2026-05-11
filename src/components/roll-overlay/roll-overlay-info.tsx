import { MODULE_ID } from "@/config/constants";
import { useHookEvent } from "@/hooks/use-hook-event";
import { DrawSteelRollOverlayData } from "@/stores/roll-overlay-store";
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

        const prompt = useMemo(() => {
            if (!data) {
                return {
                    img: "",
                    text: "",
                    type: "",
                    rollType: "",
                    tier: "",
                    total: "",
                    natural: "",
                };
            }

            const tier = resultsRevealed && data.product
                ? `${data.isCritical ? "Critical " : ""}Tier ${data.product}`
                : "";
            const natural =
                !resultsRevealed
                    ? ""
                    : data.modifier === 0
                    ? `Natural ${data.naturalResult}`
                    : `Natural ${data.naturalResult} ${data.modifier > 0 ? "+" : ""}${data.modifier}`;

            return {
                img: data.background,
                text: data.title || "Draw Steel Test",
                type: data.flavor || data.actorName,
                rollType: data.rollType,
                tier,
                total: resultsRevealed ? String(data.total) : "",
                natural,
            };
        }, [data, resultsRevealed]);

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
                <div className="absolute text-white z-[11] h-[300px] w-[300px]">
                    <div className="w-[220px] absolute font-bold text-[30px] left-1/2 top-[72px] -translate-x-1/2 -translate-y-1/2 leading-none">
                        {prompt.text}
                    </div>
                    <div className="w-[220px] absolute font-semibold text-[14px] uppercase tracking-normal left-1/2 top-[126px] -translate-x-1/2 -translate-y-1/2 opacity-80">
                        {prompt.rollType}
                    </div>
                    <div className="w-[235px] absolute font-semibold text-[19px] left-1/2 top-[162px] -translate-x-1/2 -translate-y-1/2 leading-tight">
                        {prompt.type}
                    </div>
                    <div className="w-[200px] absolute font-semibold text-[18px] left-1/2 top-[222px] -translate-x-1/2 -translate-y-1/2">
                        {prompt.tier}
                    </div>
                    <div className="absolute font-black text-[48px] left-1/2 top-[278px] -translate-x-1/2 -translate-y-1/2">
                        {prompt.total}
                    </div>
                    <div className="w-[200px] absolute font-semibold text-[14px] left-1/2 top-[322px] -translate-x-1/2 -translate-y-1/2 opacity-85">
                        {prompt.natural}
                    </div>
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

const MEDIA_VIDEO_REGEX = /\.(mp4|webm|ogg)$/i;
