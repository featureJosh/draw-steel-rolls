import { api } from "../api/api";
import { SocketLib } from "./socket";

declare global {
    var aerisBg3Rolls: typeof api;

    interface GlobalThis {
        aerisBg3Rolls: typeof aerisBg3Rolls;
    }

    var libWrapper: {
        register: (
            scope: string,
            target: number | string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
            fn: Function,
            type: "WRAPPER"
        ) => void;
    };

    var socketlib: SocketLib;

    interface GlobalThis {
        socketlib: SocketLib;
    }

    interface AssumeHookRan {
        ready: never;
    }
}
