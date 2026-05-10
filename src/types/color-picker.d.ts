/**
 * A field for picking a color and alpha
 */
declare class ColorPickerField {
    constructor(options?: { format: string });
    /** @inheritdoc */
    static get _defaults(): any;
    /** @inheritdoc */
    _validateType(value: any, options: any): any;
    isAlphaColorString(color: any): boolean;
    createPickerInput(config: any): HTMLInputElement;
    /** @override */
    _toInput(config: any): HTMLAlphaColorPickerElement;
}
import type { HTMLAlphaColorPickerElement } from "./alpha-color-picker-element.js";

declare global {
    namespace ColorPickerModule {
        class ColorPickerField {}
    }

    interface ColorPickerModule {
        ColorPickerField: ColorPickerField;
    }

    interface Game {
        colorPicker: {
            ColorPickerField: typeof ColorPickerField;
        };
    }
}
