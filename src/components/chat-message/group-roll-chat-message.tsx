import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { Card } from "../ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../ui/collapsible";

interface GroupRollChatProps {
    rolls: {
        actorName: string;
        total: number;
        dice: { value: number; kept: boolean }[];
        formula: string;
        modifier: number;
    }[];
    targetValue?: number;
    promptHeader?: string;
    promptSubheader?: string;
    img?: string;
}

export const GroupRollChat: React.FC<GroupRollChatProps> = ({
    rolls,
    targetValue,
    promptHeader,
    promptSubheader,
}: GroupRollChatProps) => {
    return (
        <div className="w-full max-w-sm bg-transparent border border-border rounded-lg overflow-hidden">
            {/* Compact header with background */}
            <div className="bg-muted/75 px-3 py-1.5 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        {promptHeader && (
                            <h4 className="text-sm font-bold truncate font-[BeaufortforLOL]">
                                {promptHeader}
                            </h4>
                        )}
                        {promptSubheader && (
                            <p className="text-xs text-muted-foreground truncate">
                                {promptSubheader}
                            </p>
                        )}
                    </div>
                    {targetValue !== undefined && (
                        <Badge
                            variant="default"
                            className="text-xs px-2 py-0.5 ml-2 font-bold font-[BeaufortforLOL]"
                        >
                            DC {targetValue}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="p-2 bg-card/75 flex flex-col gap-2 cursor-pointer">
                {rolls
                    .slice()
                    .sort((a, b) => b.total - a.total)
                    .map((r, i) => {
                        const success =
                            r.dice.some((d) => d.kept && d.value === 20) ||
                            (targetValue && r.total >= targetValue);

                        return (
                            <Collapsible
                                key={i}
                                className="[&[data-state=open]_.chevron]:rotate-180"
                            >
                                <CollapsibleTrigger asChild>
                                    <Card
                                        className={cn(
                                            "p-1 border transition-colors rounded-md gap-0",
                                            success
                                                ? "bg-emerald-50 border-emerald-300/30 dark:bg-emerald-900/30 dark:border-emerald-700"
                                                : "bg-red-50 border-red-300/30 dark:bg-red-900/30 dark:border-red-700"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex-1 font-bold truncate pr-2 font-[BeaufortforLOL]">
                                                {r.actorName}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        "font-bold text-xs font-[BeaufortforLOL]",
                                                        success &&
                                                            "text-emerald-500",
                                                        !success &&
                                                            targetValue &&
                                                            "text-destructive"
                                                    )}
                                                >
                                                    {r.total}
                                                </span>
                                                <ChevronDownIcon className="chevron h-4 w-4 transition-transform" />
                                            </div>
                                        </div>

                                        <CollapsibleContent className="pt-1 text-[12px] text-muted-foreground pb-0 font-[BeaufortforLOL] font-bold overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                            <div className="flex justify-center items-center gap-1">
                                                <div className="dice-result">
                                                    <div className="dice-tooltip">
                                                        <div className="dice">
                                                            <div className="dice-rolls flex flex-row gap-2 m-0 py-2 items-center">
                                                                {r.dice.map(
                                                                    (
                                                                        die,
                                                                        j
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                j
                                                                            }
                                                                            className={cn(
                                                                                "roll die d20 h-5 w-5 min-w-5 text-xs text-center flex items-center justify-center",
                                                                                !die.kept &&
                                                                                    "discarded"
                                                                            )}
                                                                            style={{
                                                                                backgroundSize:
                                                                                    "20px 20px",
                                                                            }}
                                                                        >
                                                                            {
                                                                                die.value
                                                                            }
                                                                        </div>
                                                                    )
                                                                )}
                                                                {r.modifier !==
                                                                    0 && (
                                                                    <span className="text-muted-foreground">
                                                                        +{" "}
                                                                        {
                                                                            r.modifier
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Card>
                                </CollapsibleTrigger>
                            </Collapsible>
                        );
                    })}
            </div>
        </div>
    );
};
