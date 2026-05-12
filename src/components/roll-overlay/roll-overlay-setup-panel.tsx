import { MODULE_ID } from "@/config/constants";
import { useGsapToggle } from "@/hooks/use-gsap-toggle";
import { useHookEvent } from "@/hooks/use-hook-event";
import { cn } from "@/lib/utils";
import {
    DrawSteelRollSetupOverlayData,
    PowerRollModifiers,
    useRollOverlayStore,
} from "@/stores/roll-overlay-store";
import React, { useEffect, useMemo, useState } from "react";
import "./roll-overlay-setup-panel.css";

interface RollOverlaySetupPanelProps {
    data: DrawSteelRollSetupOverlayData;
    isVisible: boolean;
}

type MessageModeOption = {
    key: string;
    icon: string;
    tooltip: string;
    shortLabel: string;
};

export const RollOverlaySetupPanel: React.FC<RollOverlaySetupPanelProps> = ({
    data,
    isVisible,
}) => {
    const [color, setColor] = useState<string | undefined>(
        game.settings!.get(MODULE_ID, "border-color") ?? "#ff8a1f"
    );

    useHookEvent(`${MODULE_ID}.border-color`, (value) => {
        if (value) setColor(value);
    });

    const adjustModifier = useRollOverlayStore((s) => s.adjustSetupModifier);
    const setSkill = useRollOverlayStore((s) => s.setSetupSkill);
    const setMessageMode = useRollOverlayStore((s) => s.setSetupMessageMode);
    const submitSetup = useRollOverlayStore((s) => s.submitSetup);
    const cancelSetup = useRollOverlayStore((s) => s.cancelSetup);

    const { elementRef, show, hide } = useGsapToggle({
        from: { duration: 0.55, y: 28, opacity: 0, ease: "expo.out" },
        to: { duration: 0.55, y: 0, opacity: 1 },
    });

    useEffect(() => {
        if (isVisible) show();
        else hide();
    }, [isVisible, show, hide]);

    const modes = useMessageModes();
    const disabled = data.phase === "rolling";
    const accent = color ?? "#ff8a1f";
    const hasSkills = data.skillOptions.length > 0;

    return (
        <div
            ref={elementRef}
            className="dsr-setup-panel"
            style={{ ["--accent" as any]: accent }}
        >
            <span className="dsr-setup-panel__corner dsr-setup-panel__corner--tl" />
            <span className="dsr-setup-panel__corner dsr-setup-panel__corner--tr" />
            <span className="dsr-setup-panel__corner dsr-setup-panel__corner--bl" />
            <span className="dsr-setup-panel__corner dsr-setup-panel__corner--br" />

            <button
                type="button"
                className="dsr-setup-panel__close"
                onClick={cancelSetup}
                disabled={disabled}
                data-tooltip="Cancel"
            >
                <i className="fa-solid fa-xmark" />
            </button>

            <div className="dsr-setup-panel__header">
                <div className="dsr-setup-panel__title">
                    <span className="dsr-setup-panel__title-rule dsr-setup-panel__title-rule--left" />
                    <span className="dsr-setup-panel__title-diamond">◆</span>
                    <span className="dsr-setup-panel__title-name">{data.actorName}</span>
                    <span className="dsr-setup-panel__title-diamond">◆</span>
                    <span className="dsr-setup-panel__title-rule dsr-setup-panel__title-rule--right" />
                </div>
                <div className="dsr-setup-panel__subtitle">Configure Roll</div>
            </div>

            <div className="dsr-controls-group">
                <div className="dsr-edge-row">
                    <button
                        type="button"
                        className="dsr-stepper dsr-stepper--edge"
                        disabled={disabled}
                        onClick={() => adjustModifier("edges", 1)}
                        onContextMenu={(event) => {
                            event.preventDefault();
                            if (!disabled) adjustModifier("edges", -1);
                        }}
                        data-tooltip="Left click increases, right click decreases"
                    >
                        <span className="dsr-stepper__number">{data.modifiers.edges}</span>
                        <span className="dsr-stepper__label">Edges</span>
                    </button>
                    <button
                        type="button"
                        className="dsr-stepper dsr-stepper--bane"
                        disabled={disabled}
                        onClick={() => adjustModifier("banes", 1)}
                        onContextMenu={(event) => {
                            event.preventDefault();
                            if (!disabled) adjustModifier("banes", -1);
                        }}
                        data-tooltip="Left click increases, right click decreases"
                    >
                        <span className="dsr-stepper__number">{data.modifiers.banes}</span>
                        <span className="dsr-stepper__label">Banes</span>
                    </button>
                </div>

                <div className="dsr-bonus-row">
                    <button
                        type="button"
                        className="dsr-bonus-main"
                        onClick={() => adjustModifier("bonuses", 1)}
                        onContextMenu={(event) => {
                            event.preventDefault();
                            if (!disabled) adjustModifier("bonuses", -1);
                        }}
                        disabled={disabled}
                        data-tooltip="Left click increases, right click decreases"
                    >
                        <span className="dsr-bonus-main__value">
                            {formatSigned(data.modifiers.bonuses)}
                        </span>
                        <span className="dsr-bonus-main__label">Bonuses / Penalties</span>
                    </button>
                </div>

                <div className="dsr-vis-row">
                    {modes.map((mode) => (
                        <button
                            key={mode.key}
                            type="button"
                            className={cn(
                                "dsr-vis-btn",
                                data.messageMode === mode.key && "dsr-vis-btn--active"
                            )}
                            disabled={disabled}
                            onClick={() => setMessageMode(mode.key)}
                            data-tooltip={mode.tooltip}
                        >
                            <i className={mode.icon} />
                        </button>
                    ))}
                </div>
            </div>

            {hasSkills && (
                <label className="dsr-skill-row">
                    <span className="dsr-skill-row__icon">
                        <i className="fa-solid fa-star" />
                    </span>
                    <span className="dsr-skill-row__label">Skill</span>
                    <select
                        className="dsr-skill-row__select"
                        value={data.skill ?? ""}
                        disabled={disabled}
                        onChange={(event) => setSkill(event.target.value || null)}
                    >
                        <option value="">None</option>
                        {data.skillOptions.map((skill) => (
                            <option key={skill.value} value={skill.value}>
                                {skill.group
                                    ? `${skill.group}: ${skill.label}`
                                    : skill.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <button
                type="button"
                className="dsr-roll-btn"
                onClick={submitSetup}
                disabled={disabled}
            >
                <span className="dsr-roll-btn__diamond">◆</span>
                {disabled ? "Rolling" : "Roll"}
            </button>
        </div>
    );
};

const HIDDEN_MESSAGE_MODES = new Set(["ic"]);

function useMessageModes(): MessageModeOption[] {
    return useMemo(() => {
        const modes = (CONFIG.ChatMessage as any).modes ?? {};
        const entries = Object.entries(modes)
            .filter(([key]) => !HIDDEN_MESSAGE_MODES.has(key))
            .map(([key, mode]: [string, any]) => ({
                key,
                icon: mode.icon ?? fallbackIcon(key),
                tooltip: localizeMaybe(mode.label ?? key),
                shortLabel: getShortModeLabel(key),
            }));

        return entries.length > 0
            ? entries
            : [
                  {
                      key: "public",
                      icon: fallbackIcon("public"),
                      tooltip: "Public Roll",
                      shortLabel: "Public",
                  },
                  {
                      key: "gm",
                      icon: fallbackIcon("gm"),
                      tooltip: "Private GM Roll",
                      shortLabel: "GM",
                  },
                  {
                      key: "blind",
                      icon: fallbackIcon("blind"),
                      tooltip: "Blind GM Roll",
                      shortLabel: "Blind",
                  },
                  {
                      key: "self",
                      icon: fallbackIcon("self"),
                      tooltip: "Self Roll",
                      shortLabel: "Self",
                  },
              ];
    }, []);
}

function formatSigned(value: PowerRollModifiers["bonuses"]) {
    if (value > 0) return `+${value}`;
    return String(value);
}

function fallbackIcon(mode: string) {
    switch (mode) {
        case "public":
            return "fa-solid fa-globe";
        case "gm":
            return "fa-solid fa-user-shield";
        case "blind":
            return "fa-solid fa-eye-slash";
        case "self":
            return "fa-solid fa-user";
        default:
            return "fa-solid fa-dice-d10";
    }
}

function getShortModeLabel(mode: string) {
    switch (mode) {
        case "public":
            return "Public";
        case "gm":
            return "GM";
        case "blind":
            return "Blind";
        case "self":
            return "Self";
        default:
            return mode;
    }
}

function localizeMaybe(label: string) {
    return game.i18n?.has?.(label) ? game.i18n.localize(label) : label;
}
