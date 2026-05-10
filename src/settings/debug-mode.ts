import { MODULE_ID } from "../config/constants";

export function registerDebugMode() {
    game.settings.register(MODULE_ID, "debugMode", {
        name: "Enable Debug Mode",
        hint: "",
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
    });
}

export function isDebugModeOn(): boolean {
    return !!game.settings?.get(MODULE_ID, "debugMode");
}
