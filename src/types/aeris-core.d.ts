/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DeepPartial } from "fvtt-types/utils";
import type { ComponentType } from "react";
import type ReactDOM from "react-dom/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare abstract class ReactApplication<
    C extends React.ComponentType<any>,
    P extends React.ComponentProps<C> = React.ComponentProps<C>
> extends foundry.applications.api.ApplicationV2 {
    reactDom: typeof ReactDOM;
    Component: C;
    props: P;

    static positionKey: string;

    constructor(
        reactDom: typeof ReactDOM,
        Component: C,
        props: P,
        options?: Record<string, any>
    );

    render(
        options?:
            | boolean
            | DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
        _options?: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>
    ): Promise<this>;

    close(
        options?: DeepPartial<foundry.applications.api.ApplicationV2.ClosingOptions>
    ): Promise<this>;
}

declare function createChatMessage<C extends ComponentType<any>>(
    key: string,
    props: React.ComponentProps<C>,
    msgData?: Partial<ChatMessage.CreateData>
): Promise<ChatMessage | undefined>;

/**
 * API surface exposed by the module.
 */
interface Api {
    docs: {
        registerDocsMenu(
            moduleId: string,
            options?: Partial<ClientSettings.RegisterSubmenu>
        ): void;
    };
    react: {
        app: typeof ReactApplication;
        createChatMessage: typeof createChatMessage;
    };
}

declare global {
    var aerisCore: Api;
    interface globalThis {
        aerisCore: typeof aerisCore;
    }
}

declare module "fvtt-types/configuration" {
    interface FlagConfig {
        ChatMessage: {
            "aeris-core": {
                react: {
                    key: string;
                    props: object;
                };
            };
        };
    }
    namespace Hooks {
        interface HookConfig {
            "aeris-core.registerChatComponents": (
                entries: {
                    key: string;
                    component: React.ComponentType<any>;
                    reactDom: typeof ReactDOM;
                }[]
            ) => void;
            "aeris-core.import-css": () => void;
        }
    }
}
