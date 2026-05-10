import "http://localhost:30001/modules/aeris-bg3-rolls/@vite/client";

import RefreshRuntime from "/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;

window.global = window; // some libs need this
import("http://localhost:30001/modules/aeris-bg3-rolls/src/main.tsx");
