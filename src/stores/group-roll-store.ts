import { create } from "zustand";

export type GroupParticipantStatus =
    | "setup"
    | "ready"
    | "rolling"
    | "resolved";

export interface GroupParticipantConfig {
    edges: number;
    banes: number;
    bonuses: number;
    skill: string | null;
    messageMode: string;
    difficulty?: string | null;
    characteristic?: string | null;
}

export interface GroupRollDieView {
    value: number;
    active: boolean;
}

export interface GroupParticipantResult {
    total: number;
    modifier: number;
    dice: GroupRollDieView[];
    netBoon: number;
    tier?: number;
    difficulty?: string | null;
    formula: string;
}

export interface GroupRollMetadata {
    feature?: string;
    difficulty?: string;
    currentRound?: number;
    maxRounds?: number;
    successes?: number;
    failures?: number;
    successLimit?: number;
    failureLimit?: number;
    [key: string]: unknown;
}

export interface GroupParticipant {
    uuid: string;
    userId: string | null;
    name: string;
    img: string;
    status: GroupParticipantStatus;
    config?: GroupParticipantConfig;
    result?: GroupParticipantResult;
}

export interface GroupRollOverlayData {
    groupId: string;
    title: string;
    rollType: string;
    isGm: boolean;
    participants: GroupParticipant[];
    metadata?: GroupRollMetadata;
}

interface GroupRollState {
    current: GroupRollOverlayData | null;
    shouldShow: boolean;
    resultsRevealed: boolean;
    show: (data: GroupRollOverlayData) => void;
    markReady: (uuid: string, config: GroupParticipantConfig) => void;
    setRolling: (uuid: string) => void;
    setResolved: (uuid: string, result: GroupParticipantResult) => void;
    revealResults: () => void;
    hide: () => void;
    clear: () => void;
}

export const useGroupRollStore = create<GroupRollState>((set) => ({
    current: null,
    shouldShow: false,
    resultsRevealed: false,

    show: (data) =>
        set({
            current: data,
            shouldShow: true,
            resultsRevealed: false,
        }),

    markReady: (uuid, config) =>
        set((state) => {
            if (!state.current) return state;
            return {
                current: {
                    ...state.current,
                    participants: state.current.participants.map((p) =>
                        p.uuid === uuid
                            ? { ...p, status: "ready", config }
                            : p
                    ),
                },
            };
        }),

    setRolling: (uuid) =>
        set((state) => {
            if (!state.current) return state;
            return {
                current: {
                    ...state.current,
                    participants: state.current.participants.map((p) =>
                        p.uuid === uuid ? { ...p, status: "rolling" } : p
                    ),
                },
            };
        }),

    setResolved: (uuid, result) =>
        set((state) => {
            if (!state.current) return state;
            return {
                current: {
                    ...state.current,
                    participants: state.current.participants.map((p) =>
                        p.uuid === uuid
                            ? { ...p, status: "resolved", result }
                            : p
                    ),
                },
                resultsRevealed: true,
            };
        }),

    revealResults: () => set({ resultsRevealed: true }),
    hide: () => set({ shouldShow: false }),
    clear: () =>
        set({
            current: null,
            shouldShow: false,
            resultsRevealed: false,
        }),
}));

export function allParticipantsReady(data: GroupRollOverlayData): boolean {
    return data.participants.every(
        (p) => p.status === "ready" || p.status === "resolved"
    );
}

export function allParticipantsResolved(data: GroupRollOverlayData): boolean {
    return data.participants.every((p) => p.status === "resolved");
}
