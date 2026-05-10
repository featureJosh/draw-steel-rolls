type GroupRollId = string & { readonly __groupRollId: unique symbol };

interface SetRollForEveryoneArgs {
    groupRollId: GroupRollId;
    actor: Actor;
    value: { result: number[]; modified: number[] };
    maxIndex: number;
}

interface PendingIndividualRollRequest {
    actor: Actor;
    roll?: Roll;
    advantageMode?: number;
}

interface InitiatedIndividualRollRequest extends PendingIndividualRollRequest {
    roll: Roll;
    advantageMode: number;
}

interface BaseGroupRoll<Cfg = any> {
    id: GroupRollId;
    img?: string;
    promptHeader?: string;
    promptSubheader?: string;
    targetValue?: number;
    rollConfig?: Cfg;
}

interface PendingGroupRoll<Cfg = any> extends BaseGroupRoll<Cfg> {
    status: "pending";
    rolls: PendingIndividualRollRequest[];
}

interface InitiatedGroupRoll<Cfg = any> extends BaseGroupRoll<Cfg> {
    status: "initiated";
    rolls: InitiatedIndividualRollRequest[];
}

interface CompletedGroupRoll<Cfg = any> extends BaseGroupRoll<Cfg> {
    status: "completed";
    rolls: InitiatedIndividualRollRequest[];
}

type GroupRoll<Cfg = any> =
    | PendingGroupRoll<Cfg>
    | InitiatedGroupRoll
    | CompletedGroupRoll;

interface PersistedIndividualRoll {
    actorUuid: ActorUuid;
    actorName: string;
    advantageMode?: number;
    rollData?: any;
}

interface PersistedGroupRoll extends BaseGroupRoll {
    status: "pending" | "initiated" | "completed";
    rolls: PersistedIndividualRoll[];
}
