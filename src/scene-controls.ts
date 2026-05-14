import { RequestRollDialog } from "@/dialogs/request-roll/request-roll-dialog";

export function setupSceneControls(): void {
    Hooks.on("getSceneControlButtons", (controls: any) => {
        if (!controls?.tokens?.tools) return;
        controls.tokens.tools.drawSteelRollsRequest = {
            name: "drawSteelRollsRequest",
            title: "Request Roll",
            icon: "fa-solid fa-dice",
            order: Object.keys(controls.tokens.tools).length,
            button: true,
            visible: game.user?.isGM ?? false,
            onChange: () => RequestRollDialog.open(),
        };
    });
}
