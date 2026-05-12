import { MODULE_ID } from "@/config/constants";
import { useGsapToggle } from "@/hooks/use-gsap-toggle";
import { useHookEvent } from "@/hooks/use-hook-event";
import { cn } from "@/lib/utils";
import { isCleanRollConfigurationDialogEnabled } from "@/settings/overlay";
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
    const [cleanDialog, setCleanDialog] = useState(
        isCleanRollConfigurationDialogEnabled()
    );

    useHookEvent(`${MODULE_ID}.border-color`, (value) => {
        if (value) setColor(value);
    });
    useHookEvent(`${MODULE_ID}.cleanRollConfigurationDialog`, setCleanDialog);

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
            className={cn(
                "dsr-setup-panel",
                cleanDialog && "dsr-setup-panel--clean"
            )}
            style={{ ["--accent" as any]: accent }}
        >
            <svg className="dsr-setup-panel__corner dsr-setup-panel__corner--tl" viewBox="8 15 70 60" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M19 30.382 30.5 36l-5.079-11.5c-1.771 2.401-3.724 4.208-6.421 5.882" />
                <path fill="currentColor" d="M19 24.5v5.882c2.697-1.674 4.65-3.48 6.421-5.882z" />
                <path d="M23 54c-6.426 3.343-8.21 8.01-9 20V33c1.932-.881 3.57-1.73 5-2.618M50.5 26c6.188-5.661 10.495-6.314 18.5-6.5H28.5c-1.04 1.94-2.028 3.575-3.079 5M19 30.382V24.5h6.421M19 30.382 30.5 36l-5.079-11.5M19 30.382c2.697-1.674 4.65-3.48 6.421-5.882" />
            </svg>
            <svg className="dsr-setup-panel__corner dsr-setup-panel__corner--tr" viewBox="274 15 70 60" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M333.5 30.382 322 36l5.079-11.5c1.771 2.401 3.724 4.208 6.421 5.882" />
                <path fill="currentColor" d="M333.5 24.5v5.882c-2.697-1.674-4.65-3.48-6.421-5.882z" />
                <path d="M329.5 54c6.426 3.343 8.21 8.01 9 20V33c-1.932-.881-3.57-1.73-5-2.618M302 26c-6.188-5.661-10.495-6.314-18.5-6.5H324c1.041 1.94 2.028 3.575 3.079 5m6.421 5.882V24.5h-6.421m6.421 5.882L322 36l5.079-11.5m6.421 5.882c-2.697-1.674-4.65-3.48-6.421-5.882" />
            </svg>
            <svg className="dsr-setup-panel__corner dsr-setup-panel__corner--bl" viewBox="8 318 70 60" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M18.5 364.118 30 358.5 24.921 370c-1.771-2.401-3.724-4.208-6.421-5.882" />
                <path fill="currentColor" d="M18.5 370v-5.882c2.697 1.674 4.65 3.481 6.421 5.882z" />
                <path d="M22.5 340.5c-6.426-3.343-8.21-8.009-9-20v41c1.932.881 3.57 1.731 5 2.618M50 368.5c6.188 5.662 10.495 6.314 18.5 6.5H28c-1.04-1.94-2.028-3.575-3.079-5m-6.421-5.882V370h6.421m-6.421-5.882L30 358.5 24.921 370m-6.421-5.882c2.697 1.674 4.65 3.481 6.421 5.882" />
            </svg>
            <svg className="dsr-setup-panel__corner dsr-setup-panel__corner--br" viewBox="274 318 70 60" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M333.5 364.118 322 358.5l5.079 11.5c1.771-2.401 3.724-4.208 6.421-5.882" />
                <path fill="currentColor" d="M333.5 370v-5.882c-2.697 1.674-4.65 3.481-6.421 5.882z" />
                <path d="M329.5 340.5c6.426-3.343 8.21-8.009 9-20v41c-1.932.881-3.57 1.731-5 2.618M302 368.5c-6.188 5.662-10.495 6.314-18.5 6.5H324c1.041-1.94 2.028-3.575 3.079-5m6.421-5.882V370h-6.421m6.421-5.882L322 358.5l5.079 11.5m6.421-5.882c-2.697 1.674-4.65 3.481-6.421 5.882" />
            </svg>

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

                <p className="dsr-click-hint">
                    <i className="fa-regular fa-computer-mouse-button-left" /> Left click to increase
                    &nbsp;·&nbsp;
                    <i className="fa-regular fa-computer-mouse-button-right" /> Right click to decrease
                </p>
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
