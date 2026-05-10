import { useHookEvent } from "@/hooks/use-hook-event";
import { forwardRef, useMemo, useState } from "react";
import { RollOverlayBg } from "../svg/roll-overlay-bg";

interface Props {
    data: InitiatedGroupRoll | null;
}

export const RollOverlayInfo = forwardRef<HTMLDivElement, Props>(
    ({ data }, ref) => {
        const [color, setColor] = useState<string | undefined>(
            game.settings.get(`aeris-bg3-rolls`, `border-color`) ?? "#ffffff"
        );

        useHookEvent(`aeris-bg3-rolls.border-color`, (value) => {
            if (value) setColor(value);
        });

        const prompt = useMemo(() => {
            if (!data)
                return { img: "", text: "", type: "", difficulty: "", dc: "" };

            return {
                img: data.img || "",
                text: data.promptHeader || "Group Roll",
                type: data.promptSubheader || "",
                difficulty: data.targetValue ? "DIFFICULTY CLASS" : "",
                dc: String(data.targetValue || ""),
            };
        }, [data]);

        const isVideo = MEDIA_VIDEO_REGEX.test(prompt.img);

        return (
            <div
                className="flex items-center justify-center text-center"
                ref={ref}
            >
                {prompt.img &&
                    (isVideo ? (
                        <video
                            className="absolute z-10 opacity-60 w-[352px] h-[395px] object-cover [mask-image:url('/modules/aeris-bg3-rolls/assets/roll-overlay-mask.svg')] [mask-repeat:no-repeat] [mask-position:center]"
                            src={prompt.img}
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            className="absolute z-10 opacity-60 w-[352px] h-[395px] object-cover [mask-image:url('/modules/aeris-bg3-rolls/assets/roll-overlay-mask.svg')] [mask-repeat:no-repeat] [mask-position:center]"
                            src={prompt.img}
                            alt=""
                        />
                    ))}
                <div className="absolute text-white z-[11] h-[300px] w-[300px]">
                    <div className="w-[200px] absolute font-bold text-[40px] left-1/2 top-[90px] -translate-x-1/2 -translate-y-1/2">
                        {prompt.text}
                    </div>
                    <div className="w-[200px] absolute font-semibold text-[32px] left-1/2 top-[188px] -translate-x-1/2 -translate-y-1/2">
                        {prompt.type}
                    </div>
                    <div className="w-[200px] absolute font-semibold text-[15px] left-1/2 top-[257px] -translate-x-1/2 -translate-y-1/2">
                        {prompt.difficulty}
                    </div>
                    <div className="absolute font-medium text-[36px] left-1/2 top-[300px] -translate-x-1/2 -translate-y-1/2">
                        {prompt.dc}
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

const MEDIA_VIDEO_REGEX = /\.(mp4|webm|ogg)$/i;
