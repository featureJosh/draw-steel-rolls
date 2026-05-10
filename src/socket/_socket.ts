/* eslint-disable @typescript-eslint/no-explicit-any */

import { MODULE_ID } from "../config/constants";
import {
    handleHideGroupRollRequest,
    handleShowGroupRollRequest,
    onGroupRollRequest,
} from "../listener/handler";
import { TypedSocketModule } from "../types/socket";

import { error } from "../utils/logging";
import { handleSetRollForEveryone, handleTriggerRollForActor } from "./trigger";

export let socketlibSocket: TypedSocketModule;

export const socketFunctions = {
    onGroupRollRequest,
    handleHideGroupRollRequest,
    handleSetRollForEveryone,
    handleShowGroupRollRequest,
    handleTriggerRollForActor,
};

export const setupSocket = () => {
    socketlibSocket = globalThis.socketlib.registerModule(MODULE_ID);
    if (!socketlibSocket) {
        error("Failed to register socketlib module.");
        return;
    }

    for (const [name, fn] of Object.entries(socketFunctions) as [
        keyof typeof socketFunctions,
        (...args: any[]) => any
    ][]) {
        socketlibSocket.register(name, fn);
    }
};
