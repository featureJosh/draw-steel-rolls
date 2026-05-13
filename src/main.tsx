import React from "react";
import ReactDOM from "react-dom/client";
import { groupRoll } from "./api/group-roll";
import { App } from "./App";
import { MODULE_ID } from "./config/constants";
import "./index.css";
import { setupDrawSteelRollListener } from "./listener/draw-steel-roll-listener";
import { setupPowerRollDialogOverride } from "./overrides/power-roll-dialog";
import { registerSettings } from "./settings/_register-settings";
import { setupGroupRollSocket } from "./sockets/group-roll-socket";

Hooks.once("init", () => {
    registerSettings();
    setupGroupRollSocket();
});

Hooks.once("ready", () => {
    const reactRoot = document.createElement("draw-steel-rolls-react-root");

    const root = ReactDOM.createRoot(document.body.appendChild(reactRoot));
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );

    setupDrawSteelRollListener();
    setupPowerRollDialogOverride();

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
