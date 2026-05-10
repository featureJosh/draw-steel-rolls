import { registerBorderColorSetting } from "./border-color";
import { registerDebugMode } from "./debug-mode";
import { registerDefaultImageMap } from "./default-image-map";
import { registerGroupRollsStore } from "./group-rolls";

export function registerSettings() {
    registerDebugMode();
    registerDefaultImageMap();
    registerGroupRollsStore();
    registerBorderColorSetting();
}
