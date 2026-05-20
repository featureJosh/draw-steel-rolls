import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { groupRoll } from "@/api/group-roll";
import { RequestRollDialogContent, type RollRequestConfig } from "./RequestRollDialogContent";
import "./request-roll-dialog.css";

const ApplicationV2 = (foundry as any).applications?.api?.ApplicationV2 as
    | (new (...args: unknown[]) => any)
    | undefined;

const BaseClass = ApplicationV2 ?? (class FallbackBase {} as any);

function buildRollTitle(characteristicKey: string | null): string {
    if (!characteristicKey) return "Request Roll";
    const chars = (globalThis as any).ds?.CONFIG?.characteristics as
        | Record<string, { label: string }>
        | undefined;
    const cfg = chars?.[characteristicKey];
    if (!cfg) return "Request Roll";
    const label = (game as any).i18n?.has?.(cfg.label)
        ? (game as any).i18n.localize(cfg.label)
        : cfg.label;
    return `${label} Test`;
}

class RequestRollDialogClass extends BaseClass {
    static DEFAULT_OPTIONS = {
        id: "draw-steel-rolls-request-roll",
        window: { title: "Request Roll" },
        position: { width: 440 },
    };

    #reactRoot: Root | null = null;
    static #instance: RequestRollDialogClass | null = null;

    static open(): void {
        if (RequestRollDialogClass.#instance) {
            RequestRollDialogClass.#instance.bringToTop?.();
            return;
        }
        RequestRollDialogClass.#instance = new RequestRollDialogClass();
        void RequestRollDialogClass.#instance.render({ force: true });
    }

    async _renderHTML(): Promise<HTMLElement> {
        const container = document.createElement("div");
        container.className = "dsr-react-mount";
        return container;
    }

    _replaceHTML(result: HTMLElement, content: HTMLElement): void {
        content.replaceChildren(result);
        if (!this.#reactRoot) {
            this.#reactRoot = createRoot(result);
            this.#reactRoot.render(
                <React.StrictMode>
                    <RequestRollDialogContent
                        onSubmit={this.#handleSubmit}
                        onClose={() => void this.close()}
                    />
                </React.StrictMode>
            );
        }
    }

    async _onClose(): Promise<void> {
        this.#reactRoot?.unmount();
        this.#reactRoot = null;
        RequestRollDialogClass.#instance = null;
    }

    #handleSubmit = (config: RollRequestConfig): void => {
        void this.close();
        const title = buildRollTitle(config.characteristic);
        void groupRoll({
            title,
            heroes: config.heroes,
            metadata: {
                characteristic: config.characteristic ?? undefined,
                skill: config.skill ?? undefined,
            },
        });
    };
}

export const RequestRollDialog = RequestRollDialogClass;
