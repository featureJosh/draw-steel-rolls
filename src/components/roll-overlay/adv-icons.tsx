import React from "react";
import { DieAdvantage } from "../svg/die-advantage";
import { DieDisadvantage } from "../svg/die-disadvantage";
import { DieIgnored } from "../svg/die-ignored";

interface Props {
    advantageMode: number;
}
export const AdvIcons: React.FC<Props> = ({ advantageMode }) => {
    const count = Math.abs(advantageMode);
    return (
        <div className="opacity-90 flex flex-row items-center justify-center absolute top-[19px] left-[24px] -translate-x-1/2 z-30">
            {advantageMode < 0 && (
                <DieDisadvantage className="w-[20px] h-[20px] flex items-center justify-center z-[1] scale-150" />
            )}
            {Array.from({ length: count }).map((_, i) => (
                <DieIgnored
                    key={i}
                    name="dieIgnored"
                    className="w-[12px] h-[12px] flex items-center justify-center z-[0] scale-150"
                />
            ))}
            {advantageMode > 0 && (
                <DieAdvantage
                    name="dieAdvantage"
                    className="w-[20px] h-[20px] flex items-center justify-center z-[1] scale-150"
                />
            )}
        </div>
    );
};
