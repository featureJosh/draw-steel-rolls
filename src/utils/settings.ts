export function dehydrateRolls(groupRolls: GroupRoll[]): PersistedGroupRoll[] {
    return groupRolls.map((r) => ({
        ...r,
        rolls: r.rolls.map((rr) => ({
            actorUuid: rr.actor.uuid as ActorUuid,
            actorName: rr.actor.name ?? "",
            advantageMode: rr.advantageMode,
            rollData: rr.roll ? rr.roll.toJSON() : undefined,
        })),
    }));
}

export function hydrateRolls(persisted: PersistedGroupRoll[]): GroupRoll[] {
    return persisted.map((r) => ({
        ...r,
        rolls: r.rolls.map((rr) => {
            const actor = fromUuidSync(rr.actorUuid as string) as Actor;
            return {
                actor,
                actorUuid: rr.actorUuid,
                advantageMode: rr.advantageMode,
                roll: rr.rollData ? Roll.fromData(rr.rollData) : undefined,
            } as any;
        }),
    }));
}
