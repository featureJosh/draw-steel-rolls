import React, { useState, useCallback, useEffect } from "react";
import type { GroupRollHeroInput } from "@/api/group-roll";

interface HeroEntry {
    uuid: string;
    name: string;
    img: string;
}

interface SelectOption {
    value: string;
    label: string;
    group?: string;
}

export interface RollRequestConfig {
    heroes: GroupRollHeroInput[];
    characteristic: string | null;
    skill: string | null;
}

interface Props {
    onSubmit: (config: RollRequestConfig) => void;
    onClose: () => void;
}

function loadCharacteristicOptions(): SelectOption[] {
    const chars = (globalThis as any).ds?.CONFIG?.characteristics as
        | Record<string, { label: string }>
        | undefined;
    if (!chars) return [];
    return Object.entries(chars).map(([value, cfg]) => ({
        value,
        label: (game as any).i18n?.has?.(cfg.label)
            ? (game as any).i18n.localize(cfg.label)
            : cfg.label,
    }));
}

function loadSkillOptions(): SelectOption[] {
    const list = (globalThis as any).ds?.CONFIG?.skills?.list as
        | Record<string, { label: string; group: string }>
        | undefined;
    const groups = (globalThis as any).ds?.CONFIG?.skills?.groups as
        | Record<string, { label: string }>
        | undefined;
    if (!list) return [];
    return Object.entries(list).map(([value, cfg]) => {
        const groupKey = cfg.group;
        const groupLabel = groups?.[groupKey]?.label;
        return {
            value,
            label: (game as any).i18n?.has?.(cfg.label)
                ? (game as any).i18n.localize(cfg.label)
                : cfg.label,
            group: groupLabel
                ? ((game as any).i18n?.has?.(groupLabel)
                      ? (game as any).i18n.localize(groupLabel)
                      : groupLabel)
                : undefined,
        };
    });
}

export const RequestRollDialogContent: React.FC<Props> = ({ onSubmit, onClose }) => {
    const [heroes, setHeroes] = useState<HeroEntry[]>([]);
    const [isHovering, setIsHovering] = useState(false);
    const [characteristic, setCharacteristic] = useState<string>("");
    const [skill, setSkill] = useState<string>("");
    const [characteristicOptions, setCharacteristicOptions] = useState<SelectOption[]>([]);
    const [skillOptions, setSkillOptions] = useState<SelectOption[]>([]);

    useEffect(() => {
        setCharacteristicOptions(loadCharacteristicOptions());
        setSkillOptions(loadSkillOptions());
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsHovering(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);

        let data: { type?: string; uuid?: string };
        try {
            data = JSON.parse(e.dataTransfer.getData("text/plain"));
        } catch {
            return;
        }

        if (data?.type !== "Actor" || !data.uuid) return;

        if (heroes.some((h) => h.uuid === data.uuid)) return;

        let actor: Actor | null = null;
        try {
            actor = (await fromUuid(data.uuid)) as Actor | null;
        } catch {
            return;
        }

        if (!actor || (actor as any).type !== "hero") return;

        setHeroes((prev) => [
            ...prev,
            {
                uuid: data.uuid!,
                name: actor!.name ?? "Unknown",
                img: actor!.img ?? "icons/svg/mystery-man.svg",
            },
        ]);
    }, [heroes]);

    const removeHero = useCallback((uuid: string) => {
        setHeroes((prev) => prev.filter((h) => h.uuid !== uuid));
    }, []);

    const handleSubmit = useCallback(() => {
        if (!heroes.length) return;
        onSubmit({
            heroes,
            characteristic: characteristic || null,
            skill: skill || null,
        });
    }, [heroes, characteristic, skill, onSubmit]);

    // Group skills by their group label for the <optgroup> pattern
    const skillsByGroup = skillOptions.reduce<Record<string, SelectOption[]>>(
        (acc, opt) => {
            const key = opt.group ?? "";
            (acc[key] ??= []).push(opt);
            return acc;
        },
        {}
    );
    const ungroupedSkills = skillsByGroup[""] ?? [];
    const groupedSkillKeys = Object.keys(skillsByGroup).filter((k) => k !== "");

    return (
        <div className="dsr-request-roll tw">
            {/* Hero drop zone */}
            <div
                className={`dsr-drop-zone ${isHovering ? "dsr-drop-zone--hover" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {heroes.length === 0 ? (
                    <>
                        <i className="fa-solid fa-hand-pointer dsr-drop-zone__icon" />
                        <span className="dsr-drop-zone__label">Drag heroes here</span>
                    </>
                ) : (
                    <div className="dsr-hero-list">
                        {heroes.map((hero) => (
                            <div key={hero.uuid} className="dsr-hero-row">
                                <img
                                    className="dsr-hero-row__img"
                                    src={hero.img}
                                    alt=""
                                />
                                <span className="dsr-hero-row__name">{hero.name}</span>
                                <button
                                    type="button"
                                    className="dsr-hero-row__remove"
                                    onClick={() => removeHero(hero.uuid)}
                                    aria-label={`Remove ${hero.name}`}
                                >
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            </div>
                        ))}
                        <div
                            className={`dsr-drop-zone__add ${isHovering ? "dsr-drop-zone__add--hover" : ""}`}
                        >
                            <i className="fa-solid fa-plus" />
                            <span>Drop another hero</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Roll configuration */}
            <div className="dsr-config-row">
                {/* Characteristic */}
                <div className="dsr-field">
                    <label className="dsr-label" htmlFor="dsr-characteristic">
                        Characteristic
                        <span className="dsr-label__optional">optional</span>
                    </label>
                    <select
                        id="dsr-characteristic"
                        className="dsr-select"
                        value={characteristic}
                        onChange={(e) => setCharacteristic(e.target.value)}
                    >
                        <option value="">— none —</option>
                        {characteristicOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Skill */}
                <div className="dsr-field">
                    <label className="dsr-label" htmlFor="dsr-skill">
                        Skill
                        <span className="dsr-label__optional">optional</span>
                    </label>
                    <select
                        id="dsr-skill"
                        className="dsr-select"
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                    >
                        <option value="">— none —</option>
                        {ungroupedSkills.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                        {groupedSkillKeys.map((group) => (
                            <optgroup key={group} label={group}>
                                {skillsByGroup[group].map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>

            {/* Actions */}
            <div className="dsr-actions">
                <button
                    type="button"
                    className="dsr-btn dsr-btn--primary"
                    disabled={heroes.length === 0}
                    onClick={handleSubmit}
                >
                    <i className="fa-solid fa-dice" />
                    Request Roll
                </button>
                <button
                    type="button"
                    className="dsr-btn dsr-btn--secondary"
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
