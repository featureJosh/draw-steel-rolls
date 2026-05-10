/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
    SocketFnKey,
    SocketFunctionMap,
    UnserializedParam,
} from "../types/socket";
import { serialize } from "../utils/serialize";
import { socketlibSocket } from "./_socket";

/** Send a payload to the GM, by socket name, with full type safety. */
export function executeAsGM<K extends SocketFnKey>(
    fn: K,
    data: UnserializedParam<K>
) {
    const payload = serialize(data);
    const args = [payload] as unknown as Parameters<SocketFunctionMap[K]>;
    return socketlibSocket.executeAsGM(fn, ...args);
}

export function broadcast<K extends SocketFnKey>(fn: K): Promise<void>;

export function broadcast<K extends SocketFnKey>(
    fn: K,
    data: UnserializedParam<K>
): Promise<void>;

/** Broadcast a payload to everyone. */
export async function broadcast<K extends SocketFnKey>(
    fn: K,
    data?: UnserializedParam<K>
): Promise<void> {
    if (data === undefined) {
        // fire off the socket with no payload
        await socketlibSocket.executeForEveryone(fn as any);
    } else {
        // serialize + payload
        const payload = await serialize(data);
        await socketlibSocket.executeForEveryone(
            fn as any,
            payload as Parameters<SocketFunctionMap[K]>[0]
        );
    }
}
