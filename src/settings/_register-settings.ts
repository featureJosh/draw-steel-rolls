import { registerBorderColorSetting } from "./border-color";
import { registerDebugModeSetting } from "./debug-mode";
import { registerOverlaySettings } from "./overlay";

export function registerSettings() {
    registerDebugModeSetting();
    registerOverlaySettings();
    registerBorderColorSetting();
}
