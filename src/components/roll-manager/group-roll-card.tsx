import { Card } from "@/components/ui/card";
import { Edit, Play, Trash2, UserPlus, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";

const getStatusColor = (groupRoll: GroupRoll) => {
    switch (groupRoll.status) {
        case "pending":
            return "secondary";
        case "initiated":
            return "default";
        case "completed":
            return "outline";
    }
};

export const GroupRollCard = <Cfg,>({
    groupRoll,
    adapter,
    handleInitiateRoll,
    handleEditRoll,
    handleDeleteRoll,
    handleSelectTokens,
    handleRemoveParticipant,
}: {
    groupRoll: GroupRoll<Cfg>;
    adapter: GroupRollAdapter<Cfg>;
    handleInitiateRoll: () => void;
    handleEditRoll: () => void;
    handleDeleteRoll: () => void;
    handleSelectTokens: () => void;
    handleRemoveParticipant: (actor: Actor) => void;
}) => {
    return (
        <Card key={groupRoll.id} className="py-0 pt-2 px-2.5 pb-2">
            <div className="flex flex-col gap-1">
                {/* Header row with title, DC, and status */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h3 className="text-xs font-semibold truncate">
                            {groupRoll.promptHeader}
                        </h3>
                        {groupRoll.targetValue && (
                            <span className="text-xs text-muted-foreground font-mono">
                                DC {groupRoll.targetValue}
                            </span>
                        )}
                    </div>
                    <Badge
                        variant={getStatusColor(groupRoll)}
                        className="text-xs px-1.5 py-0 h-4"
                    >
                        {groupRoll.status}
                    </Badge>
                </div>

                {/* Subheader if present */}
                <p className="text-xs text-muted-foreground italic truncate">
                    {groupRoll.rollConfig
                        ? adapter.getLabel(groupRoll.rollConfig)
                        : "Undefined Roll"}
                </p>

                {/* Players and actions row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1 flex-1 items-center">
                        {groupRoll.rolls.length ? (
                            groupRoll.rolls.map((r) => (
                                <Badge
                                    key={r.actor.uuid}
                                    variant="outline"
                                    className="flex items-center gap-1 text-xs transition-colors hover:bg-muted hover:text-foreground"
                                    onMouseEnter={() => {
                                        // highlight all tokens for this actor
                                        canvas?.tokens?.placeables.forEach(
                                            (t) => {
                                                if (
                                                    t.actor?.uuid ===
                                                    r.actor.uuid
                                                ) {
                                                    //@ts-expect-error protected
                                                    t._onHoverIn?.({}); // simulate hover
                                                    t.refresh();
                                                }
                                            }
                                        );
                                    }}
                                    onMouseLeave={() => {
                                        // remove highlight
                                        canvas?.tokens?.placeables.forEach(
                                            (t) => {
                                                if (t.actor === r.actor) {
                                                    //@ts-expect-error protected
                                                    t._onHoverOut?.({});
                                                    t.refresh();
                                                }
                                            }
                                        );
                                    }}
                                    onClick={() => {
                                        canvas?.tokens?.releaseAll();
                                        canvas?.tokens?.placeables.forEach(
                                            (t) => {
                                                if (t.actor === r.actor) {
                                                    t.control({
                                                        releaseOthers: false,
                                                    });
                                                }
                                            }
                                        );
                                    }}
                                >
                                    {r.actor.name}
                                    <button
                                        onClick={() =>
                                            handleRemoveParticipant(r.actor)
                                        }
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <span className="text-xs italic text-muted-foreground">
                                No players added
                            </span>
                        )}
                    </div>
                </div>
                <TooltipProvider>
                    <div className="flex gap-1 justify-end mt-1">
                        {groupRoll.status === "pending" && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0"
                                        onClick={handleSelectTokens}
                                    >
                                        <UserPlus className="w-3 h-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Select players</TooltipContent>
                            </Tooltip>
                        )}

                        {groupRoll.status === "pending" && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0"
                                        onClick={handleInitiateRoll}
                                    >
                                        <Play className="w-3 h-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Initiate roll</TooltipContent>
                            </Tooltip>
                        )}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    onClick={handleEditRoll}
                                >
                                    <Edit className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit roll</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    onClick={handleDeleteRoll}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete roll</TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>
        </Card>
    );
};
