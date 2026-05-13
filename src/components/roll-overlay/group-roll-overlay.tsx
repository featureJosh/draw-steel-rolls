import { MODULE_ID } from "@/config/constants";
import { useGsapToggle } from "@/hooks/use-gsap-toggle";
import { useHookEvent } from "@/hooks/use-hook-event";
import { cn } from "@/lib/utils";
import { rollAllParticipants } from "@/sockets/group-roll-socket";
import {
    allParticipantsReady,
    allParticipantsResolved,
    GroupParticipant,
    useGroupRollStore,
} from "@/stores/group-roll-store";
import React, { useEffect, useState } from "react";
import { DieAdvantage } from "../svg/die-advantage";
import { DieDisadvantage } from "../svg/die-disadvantage";
import { PlayerRollBorder } from "../svg/player-roll-border";
import { RollOverlayBg } from "../svg/roll-overlay-bg";

const OVERLAY_BACKDROP_OPACITY = 0.88;
const OVERLAY_BASE_Z_INDEX = 100;
const OVERLAY_Z_INDEX_OFFSET = 1;
const FOUNDRY_WINDOW_SELECTOR = [
    "#ui-windows > .app",
    "#ui-windows > .window-app",
    "#ui-windows > .application",
    "body > .app.window-app",
    "body > .application",
].join(", ");

export const GroupRollOverlay: React.FC = () => {
    const current = useGroupRollStore((s) => s.current);
    const shouldShow = useGroupRollStore((s) => s.shouldShow);

    const [phase, setPhase] = useState<"hidden" | "visible">("hidden");

    const {
        elementRef,
        show: playShow,
        hide: playHide,
    } = useGsapToggle({
        from: { duration: 0.75, y: 50, opacity: 0, ease: "expo.out" },
        to: { duration: 0.75, y: 0, opacity: 1 },
        onShown: () => setPhase("visible"),
        onHidden: () => setPhase("hidden"),
    });

    const {
        elementRef: bgRef,
        show: showBg,
        hide: hideBg,
    } = useGsapToggle({
        from: { opacity: 0, ease: "expo.out" },
        to: { opacity: OVERLAY_BACKDROP_OPACITY },
    });

    useEffect(() => {
        if (shouldShow) {
            playShow();
            showBg();
        } else {
            playHide();
            hideBg();
        }
    }, [shouldShow]);

    useEffect(() => {
        const root = document.querySelector<HTMLElement>(
            "draw-steel-rolls-react-root"
        );
        if (!root) return;

        if (!shouldShow) {
            return;
        }

        const syncZIndex = () => {
            const zIndex = getTopFoundryWindowZIndex() + OVERLAY_Z_INDEX_OFFSET;
            const next = String(zIndex);
            if (root.style.zIndex !== next) root.style.zIndex = next;
        };

        syncZIndex();

        const observer = new MutationObserver(syncZIndex);
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class", "style"],
            childList: true,
            subtree: true,
        });

        return () => observer.disconnect();
    }, [shouldShow]);

    if (!current) return null;

    return (
        <>
            <div
                ref={bgRef}
                className={`absolute left-0 top-0 inset-0 w-full h-full pointer-events-none ${
                    phase === "visible" ? "flex" : "hidden"
                } bg-black opacity-0`}
            />
            <div
                className={`absolute left-0 top-0 inset-0 w-full h-full ${
                    phase === "visible" ? "flex" : "hidden"
                } flex-col justify-center items-center font-[BeaufortforLOL] text-white`}
            >
                <div
                    ref={elementRef}
                    className="flex flex-col items-center justify-center text-center gap-[1.5em]"
                >
                    <GroupRollMainCard data={current} />
                    <div className="flex flex-row justify-center items-start gap-2">
                        {current.participants.map((participant) => (
                            <GroupRollPlayerCard
                                key={participant.uuid}
                                participant={participant}
                            />
                        ))}
                    </div>
                    {current.isGm && (
                        <GroupRollTriggerButton
                            groupId={current.groupId}
                            enabled={allParticipantsReady(current)}
                            done={allParticipantsResolved(current)}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

const GroupRollMainCard: React.FC<{
    data: NonNullable<ReturnType<typeof useGroupRollStore.getState>["current"]>;
}> = ({ data }) => {
    const [color, setColor] = useState<string | undefined>(
        game.settings!.get(MODULE_ID, "border-color") ?? "#ffffff"
    );

    useHookEvent(`${MODULE_ID}.border-color`, (value) => {
        if (value) setColor(value);
    });

    const summary = buildGroupSummary(data);

    return (
        <div className="flex items-center justify-center text-center">
            <div className="absolute text-white z-[11] h-[340px] w-[300px]">
                <div className="w-[230px] absolute font-semibold text-[14px] uppercase tracking-normal left-1/2 top-[48px] -translate-x-1/2 -translate-y-1/2 opacity-80 truncate">
                    {data.rollType}
                </div>
                <div className="w-[230px] absolute font-bold text-[28px] left-1/2 top-[86px] -translate-x-1/2 -translate-y-1/2 leading-none">
                    {data.title}
                </div>
                <div className="w-[220px] absolute font-semibold text-[13px] uppercase tracking-normal left-1/2 top-[124px] -translate-x-1/2 -translate-y-1/2 opacity-80">
                    Group Roll
                </div>
                <div className="absolute left-1/2 top-[176px] -translate-x-1/2 -translate-y-1/2">
                    <div className="font-black text-[52px] leading-none">
                        {summary.headline}
                    </div>
                </div>
                <div className="w-[220px] absolute font-black text-[13px] uppercase tracking-normal left-1/2 top-[235px] -translate-x-1/2 -translate-y-1/2">
                    {summary.subline}
                </div>
                <div className="w-[220px] absolute font-semibold text-[18px] left-1/2 top-[282px] -translate-x-1/2 -translate-y-1/2">
                    {summary.tier}
                </div>
            </div>
            <RollOverlayBg
                className="drop-shadow-[0px_10px_20px_rgba(0,0,0,0.5)]"
                stroke={color}
                fill={color}
                style={{ color }}
            />
        </div>
    );
};

const GroupRollPlayerCard: React.FC<{ participant: GroupParticipant }> = ({
    participant,
}) => {
    const [color, setColor] = useState<string | undefined>(
        game.settings!.get(MODULE_ID, "border-color") ?? "#ffffff"
    );

    useHookEvent(`${MODULE_ID}.border-color`, (value) => {
        if (value) setColor(value);
    });

    const actorMaskStyle = {
        maskImage: `url('/modules/${MODULE_ID}/assets/player-roll-border-mask.svg')`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
        WebkitMaskImage: `url('/modules/${MODULE_ID}/assets/player-roll-border-mask.svg')`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
    } as const;

    const result = participant.result;
    const config = participant.config;
    const isResolved = participant.status === "resolved" && !!result;
    const portraitLabel = portraitLabelFor(participant);

    return (
        <div className="relative flex w-[260px] min-h-[190px] flex-col items-center justify-start gap-2 px-4 pt-3 pb-4 pointer-events-auto">
            <div className="relative flex h-[108px] w-[120px] items-center justify-center">
                {participant.img && (
                    <img
                        className="absolute left-1/2 top-1/2 z-10 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 object-cover object-center opacity-70"
                        style={actorMaskStyle}
                        src={participant.img}
                        alt=""
                    />
                )}
                <PlayerRollBorder
                    className="absolute left-1/2 top-1/2 h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 opacity-90"
                    color={color}
                />
                {!isResolved && portraitLabel && (
                    <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center text-[14px] font-black uppercase tracking-[0.18em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                        {portraitLabel}
                    </div>
                )}
                {isResolved && result && (
                    <div className="absolute left-1/2 top-1/2 z-20 flex h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border border-white/35 bg-black/80 text-[28px] font-black leading-none text-white shadow-[0_4px_10px_rgba(0,0,0,0.45)]">
                        {result.total}
                    </div>
                )}
            </div>

            <div className="flex h-5 items-center justify-center">
                <StatusBadge
                    status={participant.status}
                    netBoon={
                        config
                            ? toInt(config.edges) - toInt(config.banes)
                            : 0
                    }
                />
            </div>

            <div className="max-w-full truncate text-center text-[16px] font-bold leading-none text-white z-[12]">
                {participant.name}
            </div>

            <div className="flex h-10 items-center justify-center gap-2 z-[13]">
                {isResolved && result ? (
                    <>
                        {result.dice.map((die, index) => (
                            <div
                                key={`${participant.uuid}-die-${index}`}
                                className={cn(
                                    "relative flex h-10 min-w-10 items-center justify-center rounded-sm border border-white/50 bg-black/75 px-2 text-[20px] font-black leading-none shadow-[0_6px_12px_rgba(0,0,0,0.35)]",
                                    !die.active && "opacity-45 line-through"
                                )}
                            >
                                {die.value}
                            </div>
                        ))}
                        <div className="relative flex h-10 min-w-14 items-center justify-center rounded-sm border border-white/30 bg-white/90 px-2 text-[20px] font-black leading-none text-black">
                            {result.netBoon > 0 && (
                                <span className="absolute -left-2 -top-2 z-[15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                    <DieAdvantage className="h-[20px] w-[18px]" />
                                </span>
                            )}
                            {result.netBoon < 0 && (
                                <span className="absolute -left-2 -top-2 z-[15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                    <DieDisadvantage className="h-[20px] w-[18px]" />
                                </span>
                            )}
                            {result.total}
                        </div>
                    </>
                ) : (
                    <div className="invisible h-10 w-10" aria-hidden />
                )}
            </div>

            <div className="h-4 text-center text-[12px] font-semibold uppercase tracking-normal text-white/75">
                {isResolved && result ? result.formula : ""}
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{
    status: GroupParticipant["status"];
    netBoon: number;
}> = ({ status, netBoon }) => {
    const label = statusLabel(status);
    const tone = statusTone(status);

    if (status === "resolved" && netBoon !== 0) {
        const isEdge = netBoon > 0;
        const count = Math.abs(netBoon);
        const word = isEdge
            ? count === 1
                ? "Edge"
                : "Edges"
            : count === 1
            ? "Bane"
            : "Banes";
        return (
            <div
                className={cn(
                    "z-[14] flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-black uppercase leading-none tracking-normal shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
                    isEdge
                        ? "border-emerald-300/70 bg-emerald-500/20 text-emerald-100"
                        : "border-rose-300/70 bg-rose-500/20 text-rose-100"
                )}
            >
                <span
                    className={cn(
                        "h-2 w-2 rounded-full",
                        isEdge ? "bg-emerald-300" : "bg-rose-300"
                    )}
                />
                <span>
                    {count} {word}
                </span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "z-[14] flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-black uppercase leading-none tracking-normal shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
                tone
            )}
        >
            <span className="h-2 w-2 rounded-full bg-white/80" />
            <span>{label}</span>
        </div>
    );
};

const GroupRollTriggerButton: React.FC<{
    groupId: string;
    enabled: boolean;
    done: boolean;
}> = ({ groupId, enabled, done }) => {
    const onClick = () => {
        if (!enabled || done) return;
        void rollAllParticipants(groupId);
    };

    return (
        <button
            type="button"
            className={cn(
                "pointer-events-auto flex h-12 w-[260px] items-center justify-center gap-3 rounded-[3px] border text-[15px] font-black uppercase tracking-[0.24em] transition disabled:opacity-45",
                enabled && !done
                    ? "border-orange-300/70 bg-black/62 text-orange-100 shadow-[0_0_20px_rgba(255,136,0,0.16),inset_0_0_18px_rgba(255,255,255,0.04)] hover:bg-orange-300/12"
                    : "border-white/22 bg-black/52 text-white/60"
            )}
            onClick={onClick}
            disabled={!enabled || done}
        >
            <span className="text-[12px]">◆</span>
            {done ? "Resolved" : "Group Roll"}
        </button>
    );
};

function buildGroupSummary(data: {
    participants: GroupParticipant[];
}): { headline: string; subline: string; tier: string } {
    const resolved = data.participants.filter((p) => p.status === "resolved");
    if (!resolved.length) {
        const readyCount = data.participants.filter(
            (p) => p.status === "ready"
        ).length;
        return {
            headline: `${readyCount}/${data.participants.length}`,
            subline: "Awaiting Setup",
            tier: "",
        };
    }

    if (resolved.length < data.participants.length) {
        return {
            headline: "...",
            subline: "Rolling",
            tier: "",
        };
    }

    return {
        headline: "—",
        subline: "Results Ready",
        tier: "Successes / Failures TBD",
    };
}

function portraitLabelFor(participant: GroupParticipant): string {
    switch (participant.status) {
        case "setup":
            return "Setup";
        case "ready":
            return "Ready";
        case "rolling":
            return "Rolling";
        default:
            return "";
    }
}

function statusLabel(status: GroupParticipant["status"]): string {
    switch (status) {
        case "setup":
            return "Configuring";
        case "ready":
            return "Ready";
        case "rolling":
            return "Rolling";
        case "resolved":
            return "Resolved";
    }
}

function statusTone(status: GroupParticipant["status"]): string {
    switch (status) {
        case "ready":
            return "border-emerald-300/70 bg-emerald-500/20 text-emerald-100";
        case "rolling":
            return "border-amber-300/70 bg-amber-500/20 text-amber-100";
        case "resolved":
            return "border-white/40 bg-white/15 text-white";
        default:
            return "border-white/25 bg-white/10 text-white/85";
    }
}

function toInt(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function getTopFoundryWindowZIndex(): number {
    return Array.from(
        document.querySelectorAll<HTMLElement>(FOUNDRY_WINDOW_SELECTOR)
    ).reduce((topZIndex, element) => {
        const value = Number.parseInt(
            window.getComputedStyle(element).zIndex,
            10
        );
        return Math.max(
            topZIndex,
            Number.isFinite(value) ? value : OVERLAY_BASE_Z_INDEX
        );
    }, OVERLAY_BASE_Z_INDEX);
}
