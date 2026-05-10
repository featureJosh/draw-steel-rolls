import type { socketFunctions } from "../socket/_socket";

interface SocketLib {
    registerModule(id: string): TypedSocketModule;
    modules: Map<string, TypedSocketModule>;
}

declare const socketlib: SocketLib;

type SocketFunctionMap = typeof socketFunctions;
type SocketFnKey = keyof SocketFunctionMap;

type SocketRawParam<K extends SocketFnKey> = Parameters<
    SocketFunctionMap[K]
>[0];

type UnserializeProperty<T> = T extends Serialized<infer U> ? U : T;

type UnserializeObject<T> = {
    [K in keyof T]: UnserializeProperty<T[K]>;
};

type UnserializedParam<K extends SocketFnKey> = Unserialized<
    UnserializeObject<SocketRawParam<K>>
>;

interface TypedSocketModule {
    executeForEveryone<K extends SocketFnKey>(
        key: K,
        ...args: Parameters<SocketFunctionMap[K]>
    ): void;

    executeForOthers<K extends SocketFnKey>(
        key: K,
        ...args: Parameters<SocketFunctionMap[K]>
    ): void;

    executeAsUser<K extends SocketFnKey>(
        key: K,
        userId: string,
        ...args: Parameters<SocketFunctionMap[K]>
    ): Promise<Awaited<ReturnType<SocketFunctionMap[K]>>>;

    executeAsGM<K extends SocketFnKey>(
        key: K,
        ...args: Parameters<SocketFunctionMap[K]>
    ): Promise<Awaited<ReturnType<SocketFunctionMap[K]>>>;

    register<K extends SocketFnKey>(key: K, fn: SocketFunctionMap[K]): void;
}
