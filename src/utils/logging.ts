import { MODULE_ID } from "../config/constants";
import { isDebugModeEnabled } from "../settings/debug-mode";

export const log = (...msg: any[]) => console.error(`${MODULE_ID} | `, ...msg);

export const debug = (...msg: any[]) => {
    if (isDebugModeEnabled()) console.debug(`${MODULE_ID} | `, ...msg);
};

export const warn = (...msg: any[]) => console.warn(`${MODULE_ID} | `, ...msg);

export const error = (...msg: any[]) =>
    console.error(`${MODULE_ID} | `, ...msg);

export const notifyInfo = (msg: string) =>
    ui.notifications?.info(`${MODULE_ID} | ${msg}`);

export const notifyWarn = (msg: string) =>
    ui.notifications?.warn(`${MODULE_ID} | ${msg}`);
