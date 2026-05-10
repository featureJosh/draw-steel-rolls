import { MODULE_ID } from "@/config/constants";

export const COLOR_FORMAT = "hexa";

export function registerBorderColorSetting() {
    game.settings.register(MODULE_ID, "border-color", {
        name: "Roll Overlay Color",
        hint: "Color used for the Roll Overlay.",
        scope: "world",
        config: true,
        type: new game.colorPicker!.ColorPickerField({
            format: COLOR_FORMAT,
        }) as unknown as StringConstructor,
        default: "#ff8800FF",
        onChange: (value) => {
            Hooks.call(
                `aeris-bg3-rolls.border-color`,
                value as string | undefined
            );
        },
    });
}
