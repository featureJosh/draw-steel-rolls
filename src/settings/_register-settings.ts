import { registerBorderColorSetting } from "./border-color";
import { registerOverlaySettings } from "./overlay";

export function registerSettings() {
    registerOverlaySettings();
    registerBorderColorSetting();
}
