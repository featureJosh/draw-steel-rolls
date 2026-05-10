import {
    GroupRollEditor,
    GroupRollEditorProps,
} from "@/components/roll-manager/group-roll-editor";
import ReactDOM from "react-dom/client";

let groupRollEditorCls: any = null;

export function getGroupRollEditor() {
    if (!aerisCore) return;
    if (groupRollEditorCls) return groupRollEditorCls;

    class GroupRollEditorApp extends aerisCore.react.app<
        typeof GroupRollEditor
    > {
        static positionKey: string = "group-roll-editor";
        constructor(props: GroupRollEditorProps<any>) {
            super(ReactDOM, GroupRollEditor, props, {
                id: `group-roll-editor-${props.groupRoll.id}`,
                title: "Group Roll Editor",
                window: {
                    title: "Edit Group Roll",
                    icon: "fa-solid fa-dice-d20",
                },
                position: {
                    width: 420,
                    height: "auto",
                },
            });
        }
    }

    groupRollEditorCls = GroupRollEditorApp;

    return groupRollEditorCls;
}
