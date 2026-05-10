import { MODULE_ID } from "../config/constants";

export function registerDefaultImageMap() {
    game.settings.register(MODULE_ID, "imageOverrides", {
        name: "Default Images",
        hint: "",
        scope: "world",
        config: false,
        default: {},
        type: Object,
    });
}

export function getImageForGroupRollKey(key: string): string {
    const map = game.settings?.get(MODULE_ID, "imageOverrides") ?? {};
    return map[key] ?? "/modules/aeris-bg3-rolls/assets/roll_bg_2.webm";
}
