import { getAdapter } from "@/adapters/get-adapter";
import { getGroupRollEditor } from "@/apps/group-roll-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dehydrateRolls, hydrateRolls } from "@/utils/settings";
import { Plus } from "lucide-react";
import { useState } from "react";
import { GroupRollChat } from "../chat-message/group-roll-chat-message";
import { GroupRollCard } from "./group-roll-card";

export const GroupRollManager = () => {
    const persisted = game.settings.get(
        "aeris-bg3-rolls",
        "groupRolls"
    ) as PersistedGroupRoll[];

    const [groupRolls, setGroupRolls] = useState<GroupRoll[]>(
        hydrateRolls(persisted)
    );

    const updateRolls = (updater: (prev: GroupRoll[]) => GroupRoll[]) => {
        setGroupRolls((prev) => {
            const next = updater(prev);
            game.settings.set(
                "aeris-bg3-rolls",
                "groupRolls",
                dehydrateRolls(next)
            );
            return next;
        });
    };

    const handleCreateRoll = () => {
        const controlled = canvas?.tokens?.controlled ?? [];
        const selected: PendingIndividualRollRequest[] = Array.from(
            new Map(
                controlled
                    .filter((t) => !!t.actor)
                    .map((t) => [
                        t.actor!.uuid,
                        {
                            actor: t.actor!,
                            actorUuid: t.actor!.uuid as ActorUuid,
                            actorName: t.actor?.name ?? "",
                        },
                    ])
            ).values()
        );

        const newRoll: PendingGroupRoll = {
            id: foundry.utils.randomID() as GroupRollId,
            status: "pending",
            rolls: selected,
            img: "/modules/aeris-bg3-rolls/assets/roll_bg_2.webm",
        };

        const GroupRollEditorApp = getGroupRollEditor();

        const app = new GroupRollEditorApp({
            groupRoll: newRoll,
            adapter: getAdapter(),
            onSave: (data: Omit<PendingGroupRoll, "id" | "status">) => {
                updateRolls((prev) => [
                    ...prev,
                    { id: newRoll.id, ...data, status: "pending" },
                ]);
                app.close();
            },
            onCancel: () => app.close(),
        });
        app.render(true);
    };

    const handleEditRoll = (roll: PendingGroupRoll) => {
        const GroupRollEditorApp = getGroupRollEditor();

        const app = new GroupRollEditorApp({
            groupRoll: roll,
            adapter: getAdapter(),
            onSave: (data: Omit<PendingGroupRoll, "id" | "status">) => {
                updateRolls((prev) => {
                    const exists = prev.some((r) => r.id === roll.id);

                    if (exists) {
                        return prev.map((r) => {
                            if (r.id !== roll.id) return r;
                            if (r.status !== "pending") return r;

                            return { ...r, ...data };
                        });
                    } else {
                        return [
                            ...prev,
                            {
                                id: roll.id,
                                ...data,
                                status: "pending" as const,
                            },
                        ];
                    }
                });

                app.close();
            },
            onCancel: () => app.close(),
        });

        app.render(true);
    };

    const handleDeleteRoll = (rollId: string) => {
        updateRolls((prev) => prev.filter((roll) => roll.id !== rollId));
    };

    const handleInitiateRoll = async (rollId: string) => {
        const groupRoll = groupRolls.find(
            (r) => r.id === rollId
        ) as PendingGroupRoll;
        if (!groupRoll) return;

        if (!groupRoll.rolls.length) {
            ui.notifications?.warn("No participants in this group roll.");
            return;
        }
        if (!groupRoll.rollConfig) {
            ui.notifications?.warn("No roll type configured.");
            return;
        }
        if (groupRoll.status !== "pending") {
            ui.notifications.warn("Cannot initiated this group roll.");
        }
        const executedRolls = await Promise.all(
            groupRoll.rolls.map(async (req) => {
                const result = await getAdapter().execute({
                    ...req,
                    config: groupRoll.rollConfig!,
                });
                return {
                    actor: req.actor,
                    roll: result! as Roll,
                    advantageMode: 0,
                };
            })
        );

        updateRolls((prev) =>
            prev.map((r) =>
                r.id === rollId
                    ? {
                          ...r,
                          status: "initiated" as const,
                          rolls: executedRolls,
                      }
                    : r
            )
        );

        await aerisBg3Rolls.requestGroupRoll({
            id: groupRoll.id,
            rolls: executedRolls,
            promptHeader: groupRoll.promptHeader ?? "",
            promptSubheader: getAdapter().getLabel(groupRoll.rollConfig),
            img: groupRoll.img,
            targetValue: groupRoll.targetValue,
            status: "initiated",
        });

        await aerisCore.react.createChatMessage<typeof GroupRollChat>(
            "aeris-bg3-rolls.GroupRollChat",
            {
                rolls: executedRolls.map((r) => ({
                    actorName: r.actor.name,
                    total: r.roll.total ?? 0,
                    dice: r.roll.dice.flatMap((die) =>
                        die.results.map((res) => ({
                            value: res.result,
                            kept: !!res.active,
                        }))
                    ),
                    formula: r.roll.formula,
                    modifier: r.roll.terms
                        .filter(
                            (t) => t instanceof foundry.dice.terms.NumericTerm
                        )
                        .reduce((sum, t: any) => sum + t.number, 0),
                })),
                targetValue: groupRoll.targetValue,
                promptHeader: groupRoll.promptHeader,
                promptSubheader: groupRoll.promptSubheader,
                img: groupRoll.img,
            }
        );

        updateRolls((prev) =>
            prev.map((r) => {
                if (r.id !== rollId) return r;
                if (r.status === "initiated") {
                    return { ...r, status: "completed" as const };
                }
                return r;
            })
        );

        setTimeout(() => {
            updateRolls((prev) => prev.filter((r) => r.id !== rollId));
        }, 2000);
    };

    const handleSelectTokens = (rollId: string) => {
        ui.notifications?.info(
            "Select tokens on the canvas, then press Enter."
        );

        const onConfirm = (ev: KeyboardEvent) => {
            if (ev.key === "Enter") {
                const controlled = canvas?.tokens?.controlled ?? [];
                const selected: PendingIndividualRollRequest[] = Array.from(
                    new Map(
                        controlled
                            .filter((t) => !!t.actor)
                            .map((t) => [
                                t.actor!.uuid,
                                {
                                    actor: t.actor!!,
                                    actorUuid: t.actor!.uuid as ActorUuid,
                                    actorName: t.actor?.name ?? "",
                                },
                            ])
                    ).values()
                );

                updateRolls((prev) =>
                    prev.map((r) => {
                        if (r.id !== rollId) return r;

                        const existingUuids = new Set(
                            r.rolls.map((rr) => rr.actor.uuid)
                        );
                        const newRolls = selected.filter(
                            (s) => !existingUuids.has(s.actor.uuid)
                        );

                        if (r.status === "pending") {
                            return {
                                ...r,
                                rolls: [...r.rolls, ...newRolls],
                            } satisfies PendingGroupRoll;
                        }

                        return r;
                    })
                );

                window.removeEventListener("keydown", onConfirm);
            }
        };

        window.addEventListener("keydown", onConfirm);
    };

    return (
        <div className="w-full bg-background">
            <div className="p-2 flex flex-col">
                <Button
                    onClick={handleCreateRoll}
                    size="icon"
                    variant="outline"
                    className="absolute left-4 bottom-4 pointer-events-auto z-10"
                >
                    <Plus />
                </Button>
                <ScrollArea className="h-full min-h-0">
                    <div className="p-2 space-y-2">
                        {groupRolls.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">
                                No group rolls yet
                            </p>
                        ) : (
                            groupRolls.map((groupRoll) => {
                                return (
                                    <GroupRollCard
                                        adapter={getAdapter()}
                                        key={groupRoll.id}
                                        groupRoll={groupRoll}
                                        handleEditRoll={() => {
                                            if (groupRoll.status === "pending")
                                                handleEditRoll(groupRoll);
                                        }}
                                        handleDeleteRoll={() =>
                                            handleDeleteRoll(groupRoll.id)
                                        }
                                        handleInitiateRoll={() =>
                                            handleInitiateRoll(groupRoll.id)
                                        }
                                        handleSelectTokens={() => {
                                            handleSelectTokens(groupRoll.id);
                                        }}
                                        handleRemoveParticipant={(actor) =>
                                            updateRolls((prev) =>
                                                prev.map((r) => {
                                                    if (r.id !== groupRoll.id)
                                                        return r;

                                                    switch (r.status) {
                                                        case "pending":
                                                            return {
                                                                ...r,
                                                                rolls: r.rolls.filter(
                                                                    (rr) =>
                                                                        rr.actor !==
                                                                        actor
                                                                ),
                                                            } satisfies PendingGroupRoll;
                                                        case "initiated":
                                                            return {
                                                                ...r,
                                                                rolls: r.rolls.filter(
                                                                    (rr) =>
                                                                        rr.actor !==
                                                                        actor
                                                                ),
                                                            } satisfies InitiatedGroupRoll;
                                                        case "completed":
                                                            return {
                                                                ...r,
                                                                rolls: r.rolls.filter(
                                                                    (rr) =>
                                                                        rr.actor !==
                                                                        actor
                                                                ),
                                                            } satisfies CompletedGroupRoll;
                                                    }
                                                })
                                            )
                                        }
                                    />
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};
