import type { Camera, Material, Mesh, Scene, WebGLRenderer } from "three";

export interface DiceOptions {
    enabled: boolean;
    showExtraDice: boolean;
    onlyShowOwnDice: boolean;
    hideAfterRoll: boolean;
    timeBeforeHide: number;
    hideFX: string;
    autoscale: boolean;
    scale: number;
    speed: number;

    imageQuality: "low" | "medium" | "high";
    shadowQuality: "low" | "high";
    bumpMapping: boolean;
    sounds: boolean;
    soundsSurface: string;
    soundsVolume: number;
    canvasZIndex: string;
    throwingForce: string;
    useHighDPI: boolean;
    antialiasing: "none" | "msaa" | "smaa";
    glow: boolean;
    showOthersSFX: boolean;
    immersiveDarkness: boolean;
    muteSoundSecretRolls: boolean;
    enableFlavorColorset: boolean;
    rollingArea: boolean;
}

type AppearanceSettings = {
    colorset?: string;
    labelColor?: string;
    diceColor?: string | string[];
    outlineColor?: string;
    edgeColor?: string;
    texture?: any;
    material?: string;
    font?: string;
    system?: string;
    systemSettings?: Record<string, any>;
};

type AppearanceConfig = Record<string, AppearanceSettings>;

interface SpecialEffect {
    id?: string;
    options?: Record<string, any>;
    [key: string]: any;
}

interface CustomizationConfig {
    appearance: Record<string, AppearanceSettings>;
    specialEffects: any[];
}

declare class Dice3D {
    waitFor3DAnimationByMessageID(targetMessageId: string): Promise<boolean>;

    box: DiceBox;

    static get DEFAULT_OPTIONS(): DiceOptions;

    static DEFAULT_APPEARANCE(user?: User): AppearanceConfig;

    static ALL_DEFAULT_OPTIONS(
        user?: User
    ): DiceOptions & { appearance: AppearanceConfig };

    static CONFIG(user?: User): DiceOptions;

    static APPEARANCE(user?: User): AppearanceConfig;

    static SFX(user?: User): SpecialEffect[];

    static SYSTEM_SETTINGS(user?: User): any[]; // array of system settings objects

    static ALL_CUSTOMIZATION(
        user?: User,
        dicefactory?: DiceFactory
    ): {
        appearance: AppearanceConfig;
        specialEffects: SpecialEffect[];
    };

    static ALL_CONFIG(user?: User): DiceOptions & {
        appearance: AppearanceConfig;
        specialEffects: SpecialEffect[];
    };

    DiceFactory: DiceFactory;
    exports: Dice3DExports;

    showForRoll(
        roll: Roll,
        user?: User,
        synchronize?: boolean,
        whisper?: Array<{ id: string } | string> | null,
        blind?: boolean,
        chatMessageID?: string,
        speaker?: ChatMessage["speaker"]
    ): Promise<boolean>;

    addSystem(
        data: { id: string; name: string },
        mode: "preferred" | "default"
    ): void;

    addColorset(
        colorset: DiceColorsetData,
        mode: "default" | "preferred" | "no"
    ): void;

    addDicePreset(
        data: DicePresetData,
        shape?: "d2" | "d4" | "d6" | "d8" | "d10" | "d12" | "d20"
    ): void;
}

interface Dice3DExports {
    COLORSETS: any;
    TEXTURELIST: any;
    Utils: {
        prepareFontList: () => Record<string, string>;
        prepareTextureList: () => Record<string, string>;
        prepareColorsetList: () => Record<string, Record<string, string>>;
        prepareSystemList: () => Record<string, string>;
    };
}

interface DicePresetData {
    type: string;
    labels: Array<string>;
    system: string;
    colorset?: string;
    font?: string;
    fontScale?: number;
    bumpMaps?: Array<string>;
    values?: { min: number; max: number };
}

interface DiceColorsetData {
    name: string;
    description: string;
    category: string;
    foreground: string;
    background: string;
    outline: string;
    edge: string;
    texture: Array<string>;
    material: "plastic" | "metal" | "glass" | "wood" | "chrome";
    font: string;
    fontScale?: Record<string, number>;
    visibility?: "hidden";
}

interface DicePreset {
    labels: string[];
    values: number[];
    shape: string;
    type: string;
    font?: string;
    fontScale?: number;
    emissive?: string;
    emissiveIntensity?: number;
    colorset?: string;
}

interface DiceAppearance {
    colorset: string; // name of colorset or "custom"
    foreground: string; // label color (CSS hex string)
    background: string | string[]; // die color(s), can be array
    outline: string; // label outline color
    edge: string; // edge color
    texture: any; // texture definition or "none"
    material: string; // material type ("auto", "plastic", etc.)
    font: string; // font name
    fontScale?: number; // optional scale factor
    system: string; // dice system id, e.g. "standard"
    systemSettings: Record<string, any>; // merged with default system settings
    isGhost?: boolean; // ghost dice flag
}

interface TextureFrame {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface TextureSource {
    source: HTMLImageElement | HTMLCanvasElement | ImageBitmap;
    frame: TextureFrame;
}

interface MaterialTexture {
    name: string;
    material?: string;
    id?: string;
    composite?: string;
    texture?: TextureSource;
    bump?: TextureSource;
}

interface MaterialData {
    background: string;
    foreground: string;
    outline: string;
    edge: string;
    texture: MaterialTexture | MaterialTexture[];
    material: string;
    font: string;
    fontScale: number;
    isGhost: boolean;
    cacheString: string;
}

interface ScopedTextureCache {
    textureCube?: any;
    [key: string]: any;
}

declare class DiceSystem {
    processMaterial(
        diceType: string,
        material: Material,
        appearance: DiceAppearance
    ): Material;
}

declare class DiceFactory {
    systems: Map<string, DiceSystem>;

    getAppearanceForDice(
        appearances: Record<string, AppearanceSettings>,
        dicetype: string,
        dicenotation?: { options: Record<string, any> }
    ): DiceAppearance;
    create(cache: unknown, type: string, appearance: object): Promise<Mesh>;
    getPresetBySystem(type: string, system?: string): DicePreset | null;
    generateMaterialData(
        diceobj: DicePreset,
        appearance: DiceAppearance
    ): MaterialData;

    createMaterial(
        scopedTextureCache: ScopedTextureCache,
        baseMaterialCacheString: string,
        diceobj: DicePreset,
        materialData: MaterialData
    ): Material;
}

declare class DiceBox {
    constructor(
        container: HTMLElement,
        factory: DiceFactory,
        config: DiceOptions & {
            appearance: AppearanceConfig;
            specialEffects: SpecialEffect[];
        }
    );

    container: HTMLDivElement;

    camera: Camera;
    config: DiceOptions & {
        appearance: AppearanceConfig;
        specialEffects: SpecialEffect[];
        boxType?: string;
    };
    dicefactory: DiceFactory;
    scene: Scene;
    diceList: DSNMesh[];
    renderer: WebGLRenderer & {
        scopedTextureCache: ScopedTextureCache;
    };

    renderScene(): void;
    clearScene(): void;
    clearAll(): Promise<void>;
    initialize(): Promise<void>;
    setScene: (config: { width: number; height: number }) => void;
}

type DSNMesh = Mesh & {
    notation: { type: string };
    result: number;
};
