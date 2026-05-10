import { GroupRollManager } from "@/components/roll-manager/group-roll-manager";
import ReactDOM from "react-dom/client";

let groupRollManagerCls:
    | typeof aerisCore.react.app<typeof GroupRollManager>
    | null = null;

export function getGroupRollManager() {
    if (!aerisCore) return;
    if (groupRollManagerCls) {
        return groupRollManagerCls;
    }

    groupRollManagerCls = class Class extends aerisCore.react.app<
        typeof GroupRollManager
    > {
        static positionKey: string = "group-roll-manager";

        constructor() {
            super(
                ReactDOM,
                GroupRollManager,
                {},
                {
                    id: "group-roll-manager",
                    title: "Group Roll Manager",
                    window: {
                        title: "Group Roll Manager",
                        icon: "fa-solid fa-dice-d20",
                    },
                    position: {
                        width: 220,
                        height: 400,
                    },
                }
            );
        }

        static override readonly DEFAULT_OPTIONS = foundry.utils.mergeObject(
            super.DEFAULT_OPTIONS,
            {
                id: "group-roll-manager",
            },
            { inplace: false }
        );
    };
    return groupRollManagerCls;
}
