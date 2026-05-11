import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { setupDrawSteelRollListener } from "./listener/draw-steel-roll-listener";
import { setupPowerRollDialogOverride } from "./overrides/power-roll-dialog";
import { registerSettings } from "./settings/_register-settings";

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

    setupDrawSteelRollListener();
    setupPowerRollDialogOverride();
});
