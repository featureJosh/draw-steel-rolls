import { isOverlayEnabled } from "@/settings/overlay";
import {
    PowerRollModifiers,
    PowerRollSetupPrompt,
    PowerRollSkillModifier,
    PowerRollSkillOption,
    requestPowerRollSetup,
} from "@/stores/roll-overlay-store";
import { warn } from "@/utils/logging";

const ORIGINAL_CREATE = Symbol.for("draw-steel-rolls.PowerRollDialog.originalCreate");

type PowerRollDialogCreate = (
    this: unknown,
    options?: DrawSteelPowerRollDialogOptions
) => Promise<unknown>;

type PatchedPowerRollDialog = DrawSteelPowerRollDialogConstructor & {
    [ORIGINAL_CREATE]?: PowerRollDialogCreate;
};

export function setupPowerRollDialogOverride() {
    if (game.system?.id !== "draw-steel") return;

    const PowerRollDialog = globalThis.ds?.applications?.apps?.PowerRollDialog as
        | PatchedPowerRollDialog
        | undefined;

    if (!PowerRollDialog?.create) {
        warn("Draw Steel PowerRollDialog was not available; pre-roll overlay override was not registered.");
        return;
    }

    const originalCreate = PowerRollDialog[ORIGINAL_CREATE] ?? PowerRollDialog.create;
    PowerRollDialog[ORIGINAL_CREATE] = originalCreate;

    PowerRollDialog.create = (async function patchedPowerRollDialogCreate(
        this: unknown,
        options: DrawSteelPowerRollDialogOptions = {}
    ) {
        if (this !== PowerRollDialog || !isOverlayEnabled()) {
            return originalCreate.call(this, options) as Promise<DrawSteelPowerRollPromptValue | null>;
        }

        try {
            return await requestPowerRollSetup(buildSetupPrompt(options));
        } catch (error) {
            warn("Failed to show Draw Steel Rolls setup overlay; falling back to native dialog.", error);
            return originalCreate.call(this, options) as Promise<DrawSteelPowerRollPromptValue | null>;
        }
    }) as DrawSteelPowerRollDialogConstructor["create"];
}

function buildSetupPrompt(options: DrawSteelPowerRollDialogOptions): Omit<PowerRollSetupPrompt, "id"> {
    const context = options.context ?? {};
    const windowTitle = getWindowTitle(options);

    return {
        title: windowTitle,
        rollType: getRollTypeLabel(context),
        actorName: game.user?.name ?? "Roller",
        formula: String(context.formula ?? "2d10"),
        modifiers: normalizeModifiers(context.modifiers),
        messageMode: normalizeMessageMode(
            context.messageMode ?? (game.settings as any)?.get("core", "messageMode")
        ),
        skill: typeof context.skill === "string" && context.skill ? context.skill : null,
        skillOptions: getSkillOptions(context.skills, context.skillModifiers),
        skillModifiers: getSkillModifiers(context.skillModifiers),
    };
}

function getWindowTitle(options: DrawSteelPowerRollDialogOptions): string {
    const title = options.window?.title;
    if (typeof title !== "string" || !title.trim()) return "Power Roll";

    return localizeMaybe(title);
}

function getRollTypeLabel(context: DrawSteelPowerRollDialogContext): string {
    const type = context.type;
    if (type === "ability") return "Ability Power Roll";
    if (type === "test") return "Test";
    return "Power Roll";
}

function getSkillOptions(
    skills: unknown,
    skillModifiers: unknown
): PowerRollSkillOption[] {
    const skillValues = getSkillValues(skills);
    if (!skillValues.length) return [];

    const modifiers = getSkillModifiers(skillModifiers);
    const list = globalThis.ds?.CONFIG?.skills?.list ?? {};
    const groups = globalThis.ds?.CONFIG?.skills?.groups ?? {};

    return skillValues.map((value) => {
        const skill = list[value];
        const groupKey = skill?.group;
        const baseLabel = localizeMaybe(skill?.label ?? value);
        const modifierLabel = getSkillModifierLabel(modifiers[value]);

        return {
            value,
            label: modifierLabel ? `${baseLabel} (${modifierLabel})` : baseLabel,
            group: groupKey ? localizeMaybe(groups[groupKey]?.label ?? groupKey) : undefined,
        };
    });
}

function getSkillValues(skills: unknown): string[] {
    if (!skills) return [];
    if (skills instanceof Set) return Array.from(skills).map(String);
    if (Array.isArray(skills)) return skills.map(String);
    if (typeof (skills as any).values === "function") {
        return Array.from((skills as any).values()).map(String);
    }
    if (typeof skills === "object") return Object.keys(skills);
    return [];
}

function getSkillModifiers(skillModifiers: unknown): Record<string, PowerRollSkillModifier> {
    if (!skillModifiers) return {};

    const entries =
        skillModifiers instanceof Map
            ? Array.from(skillModifiers.entries())
            : Object.entries(skillModifiers as Record<string, unknown>);

    return entries.reduce<Record<string, PowerRollSkillModifier>>((record, [skill, value]) => {
        if (!value || typeof value !== "object") return record;

        record[String(skill)] = {
            edges: toInteger((value as any).edges ?? 0),
            banes: toInteger((value as any).banes ?? 0),
        };

        return record;
    }, {});
}

function getSkillModifierLabel(modifiers?: PowerRollSkillModifier): string {
    if (!modifiers) return "";

    const labels: string[] = [];
    if (modifiers.edges) labels.push(`+${modifiers.edges} ${modifiers.edges === 1 ? "Edge" : "Edges"}`);
    if (modifiers.banes) labels.push(`+${modifiers.banes} ${modifiers.banes === 1 ? "Bane" : "Banes"}`);
    return labels.join(", ");
}

function normalizeModifiers(modifiers: unknown): PowerRollModifiers {
    const value = modifiers && typeof modifiers === "object" ? modifiers : {};

    return {
        edges: clampEdgeBane((value as any).edges ?? 0),
        banes: clampEdgeBane((value as any).banes ?? 0),
        bonuses: toInteger((value as any).bonuses ?? 0),
    };
}

function clampEdgeBane(value: unknown) {
    return Math.min(2, Math.max(0, toInteger(value)));
}

function toInteger(value: unknown) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.trunc(numeric);
}

function localizeMaybe(label: string) {
    return game.i18n?.has?.(label) ? game.i18n.localize(label) : label;
}

function normalizeMessageMode(mode: unknown) {
    const value = String(mode || "public");
    return value === "ic" ? "public" : value;
}
