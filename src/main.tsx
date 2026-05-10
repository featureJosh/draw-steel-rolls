import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { api } from "./api/api";
import { GroupRollChat } from "./components/chat-message/group-roll-chat-message";
import "./index.css";
import { registerSettings } from "./settings/_register-settings";
import { setupSocket } from "./socket/_socket";
import { setupGroupRollHooks } from "./stores/group-roll-store";

Hooks.once("setup", () => {
    setupSocket();
});

Hooks.once("init", () => {
    registerSettings();
});

Hooks.on("aeris-core.registerChatComponents", (entries) => {
    entries.push({
        key: "aeris-bg3-rolls.GroupRollChat",
        component: GroupRollChat,
        reactDom: ReactDOM,
    });
});

Hooks.once("ready", () => {
    const reactRoot = document.createElement("aeris-bg3-rolls-react-root");

    globalThis.aerisBg3Rolls = api;

    const root = ReactDOM.createRoot(document.body.appendChild(reactRoot));
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
});

Hooks.once("ready", () => {
    aerisCore.docs.registerDocsMenu("aeris-bg3-rolls");
});

Hooks.once("aeris-core.import-css", () => {
    const isDev = import.meta.env.DEV;

    if (!isDev) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "modules/aeris-bg3-rolls/assets/main.css";
        document.head.appendChild(link);
    }
});

Hooks.once("ready", () => {
    setupGroupRollHooks();
});
