import React from "react";
import ReactDOM from "react-dom/client";
import { groupRoll } from "./api/group-roll";
import { App } from "./App";
import { MODULE_ID } from "./config/constants";
import "./index.css";
import { registerSettings } from "./settings/_register-settings";
import { setupGroupRollSocket } from "./sockets/group-roll-socket";
import { setupSceneControls } from "./scene-controls";

// Register the socketlib.ready listener at module load time so we never miss
// the hook regardless of module load order.
setupGroupRollSocket();
setupSceneControls();

Hooks.once("init", () => {
    registerSettings();
});

Hooks.once("ready", () => {
    const reactRoot = document.createElement("draw-steel-rolls-react-root");

    const root = ReactDOM.createRoot(document.body.appendChild(reactRoot));
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );

    const module = game.modules?.get(MODULE_ID) as unknown as
        | { api?: Record<string, unknown> }
        | undefined;
    if (module) {
        module.api = { ...(module.api ?? {}), groupRoll };
    }
    (globalThis as any).drawSteelRolls = {
        ...((globalThis as any).drawSteelRolls ?? {}),
        groupRoll,
    };
});
