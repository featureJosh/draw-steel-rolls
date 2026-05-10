export function handleTriggerRollForActor(data: {
    groupRollId: GroupRollId;
    actorUuid: ActorUuid;
}): void {
    Hooks.call("triggerRollForActor", data);
}

export function handleSetRollForEveryone(
    data: Serialized<SetRollForEveryoneArgs>
): void {
    Hooks.call("setRollForEveryone", data);
}
