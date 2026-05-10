import { MODULE_ID } from "@/config/constants";

export function registerDebugModeSetting() {
    game.settings!.register(MODULE_ID, "debugMode", {
        name: "Debug Logging",
        hint: "Write Draw Steel Rolls diagnostic messages to the browser console.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });
}

export function isDebugModeEnabled(): boolean {
    try {
        return !!game.settings?.get(MODULE_ID, "debugMode");
    } catch {
        return false;
    }
}
