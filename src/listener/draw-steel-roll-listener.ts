import { isOverlayEnabled } from "@/settings/overlay";
import {
    DrawSteelRollDieView,
    showRollOverlay,
} from "@/stores/roll-overlay-store";
import { warn } from "@/utils/logging";

const animatedRolls = new Set<string>();
const MAX_ANIMATED_ROLL_KEYS = 500;

export function setupDrawSteelRollListener() {
    if (game.system?.id !== "draw-steel") {
        warn("Draw Steel Rolls is enabled outside the draw-steel system; roll overlay listeners were not registered.");
        return;
    }

    Hooks.on("createChatMessage", (message) => {
        void handleChatMessage(message);
    });

    Hooks.on("updateChatMessage", (message) => {
        void handleChatMessage(message);
    });
}

async function handleChatMessage(message: ChatMessage) {
    if (!isOverlayEnabled()) return;

    const data = extractNativeTestRoll(message);
    if (!data) return;

    try {
        await showRollOverlay(data);
    } catch (error) {
        warn("Failed to show Draw Steel roll overlay", error);
    }
}

function extractNativeTestRoll(message: ChatMessage) {
    if (!message.isContentVisible) return null;
    if ((message as any).blind && !game.user?.isGM) return null;
    if ((message as any).type !== "standard") return null;

    // Draw Steel uses part type "test" for characteristic tests and "abilityResult" (etc.)
    // for item/ability power rolls; gate on ds.rolls.PowerRoll below, not on part.type.
    const parts = getMessageParts((message as any).system?.parts);
    for (const part of parts) {
        const rolls = Array.isArray(part.rolls) ? part.rolls : [];
        for (let rollIndex = rolls.length - 1; rollIndex >= 0; rollIndex--) {
            const roll = rolls[rollIndex];
            if (!isPowerRoll(roll)) continue;

            const partId = String(part.id ?? part._id ?? "test");
            const key = `${message.uuid}.${partId}.${rollIndex}`;
            if (animatedRolls.has(key)) continue;

            const dice = getDice(roll);
            if (!dice.length) continue;
            rememberAnimatedRoll(key);

            const actor = getSpeakerActor(message);
            const naturalResult =
                Number((roll as any).naturalResult) ||
                dice.reduce((sum, die) => sum + (die.active ? die.value : 0), 0);
            const total = Number(roll.total ?? naturalResult);

            return {
                id: key,
                messageId: message.id ?? message.uuid ?? key,
                partId,
                rollIndex,
                title: getRollTitle(message, part, roll),
                flavor: String(part.flavor ?? (roll as any).options?.flavor ?? ""),
                actorName: actor?.name ?? message.alias ?? "Unknown",
                actorImg: actor?.img ? String(actor.img) : undefined,
                dice,
                total,
                naturalResult,
                modifier: total - naturalResult,
                tier: (roll as any).tier,
                product: (roll as any).product,
                netBoon: Number((roll as any).netBoon ?? 0),
                isCritical: !!(roll as any).isCritical,
                isNat20: !!(roll as any).isNat20,
                user: message.author ?? game.user!,
            };
        }
    }

    return null;
}

function rememberAnimatedRoll(key: string) {
    animatedRolls.add(key);

    while (animatedRolls.size > MAX_ANIMATED_ROLL_KEYS) {
        const firstKey = animatedRolls.values().next().value as string | undefined;
        if (!firstKey) break;
        animatedRolls.delete(firstKey);
    }
}

function getMessageParts(parts: unknown): any[] {
    if (!parts) return [];
    if (Array.isArray(parts)) return parts;
    if (parts instanceof Map) return Array.from(parts.values());

    if (Array.isArray((parts as any).sortedContents)) {
        return (parts as any).sortedContents;
    }

    if (typeof (parts as any).values === "function") {
        return Array.from((parts as any).values());
    }

    if (typeof (parts as any).contents === "object") {
        return Object.values((parts as any).contents);
    }

    if (typeof parts === "object") return Object.values(parts);
    return [];
}

function isPowerRoll(roll: unknown): roll is Roll {
    if (!roll || typeof roll !== "object") return false;

    const PowerRoll = globalThis.ds?.rolls?.PowerRoll;
    if (PowerRoll && roll instanceof PowerRoll) return true;
    if ((roll as any).constructor?.name === "PowerRoll") return true;

    try {
        return (roll as any).toJSON?.().class === "PowerRoll";
    } catch {
        return false;
    }
}

function getDice(roll: Roll): DrawSteelRollDieView[] {
    const d10Term = roll.dice.find((die) => Number((die as any).faces) === 10);
    if (!d10Term) return [];

    return d10Term.results.map((result) => ({
        value: Number(result.result ?? 0),
        active: result.active !== false,
    }));
}

function getRollTitle(message: ChatMessage, part: any, roll: Roll): string {
    const characteristic = getRollCharacteristic(roll);
    if (characteristic) {
        const label = globalThis.ds?.CONFIG?.characteristics?.[characteristic]?.label;
        const localized = game.i18n?.localize(label ?? characteristic) ?? label ?? characteristic;
        return `${localized} Test`;
    }

    return String((message as any).title ?? part.flavor ?? "Draw Steel Test");
}

function getRollCharacteristic(roll: Roll): string | null {
    const configured = (roll as any).options?.characteristic;
    if (
        typeof configured === "string" &&
        configured in (globalThis.ds?.CONFIG?.characteristics ?? {})
    ) {
        return configured;
    }

    const formula = String((roll as any).formula ?? "");
    const rollKey = formula.match(/@([A-Z])\b/)?.[1];
    if (!rollKey) return null;

    const characteristics = globalThis.ds?.CONFIG?.characteristics ?? {};
    const entry = Object.entries(characteristics).find(
        ([, data]) => data.rollKey === rollKey
    );

    return entry?.[0] ?? null;
}

function getSpeakerActor(message: ChatMessage): Actor | null {
    const speakerActor = message.speakerActor;
    if (speakerActor) return speakerActor as Actor;

    const chatClass = CONFIG.ChatMessage.documentClass as typeof ChatMessage & {
        getSpeakerActor?: (speaker: ChatMessage["speaker"]) => Actor | null;
    };

    return chatClass.getSpeakerActor?.(message.speaker) ?? null;
}
