/* eslint-disable @typescript-eslint/no-explicit-any */

export function serialize<T>(obj: T): Serialized<T> {
    if (obj === null || obj === undefined)
        return null as unknown as Serialized<T>;

    if (Array.isArray(obj)) {
        return obj.map(serialize) as Serialized<T>;
    }

    if (obj instanceof Set) {
        const serializedSet: unknown[] = [];
        for (const item of obj) {
            serializedSet.push(serialize(item));
        }
        return { _serializedSet: true, data: serializedSet } as Serialized<T>;
    }

    if (obj instanceof Map) {
        const serializedMap: [unknown, unknown][] = [];
        for (const [key, value] of obj.entries()) {
            serializedMap.push([serialize(key), serialize(value)]);
        }
        return { _serializedMap: true, data: serializedMap } as Serialized<T>;
    }

    if (isSerializableRoll(obj)) {
        //@ts-expect-error ignore
        delete obj.data;
        const json = obj.toJSON() as object & {
            __serialisedRoll?: boolean;
            _actorUuid?: string;
        };

        json.__serialisedRoll = true;

        // Optional: preserve actor UUID if needed for rehydration
        const subject = (obj as any)?.options?.subject;
        if (subject && subject.uuid) {
            json._actorUuid = subject.uuid;
        }

        return JSON.stringify(json) as any;
    }

    if (typeof obj === "object" && obj !== null) {
        if ("uuid" in obj) {
            return {
                valueUuid: { value: (obj as any).uuid, type: "document" },
            } as Serialized<T>;
        }

        if (
            "document" in obj &&
            typeof obj.document === "object" &&
            obj.document &&
            "uuid" in obj.document
        ) {
            return {
                valueUuid: {
                    value: (obj.document as any).uuid,
                    type: "object",
                },
            } as Serialized<T>;
        }

        const serializedObject: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            serializedObject[key] = serialize(value);
        }
        return serializedObject as Serialized<T>;
    }

    return obj as Serialized<T>;
}

export function deserialize<T>(obj: any): T {
    if (obj === null || obj === undefined) return null as any;

    if (Array.isArray(obj)) {
        return obj.map(deserialize) as any;
    }

    if (obj && typeof obj === "object" && "_serializedSet" in obj) {
        const deserializedSet = new Set();
        for (const item of obj.data) {
            deserializedSet.add(deserialize(item));
        }
        return deserializedSet as any;
    }

    if (obj && typeof obj === "object" && "_serializedMap" in obj) {
        const deserializedMap = new Map();
        for (const [key, value] of obj.data) {
            deserializedMap.set(deserialize(key), deserialize(value));
        }
        return deserializedMap as any;
    }

    if (typeof obj === "string" && obj.includes('"__serialisedRoll"')) {
        const roll = Roll.fromJSON(obj);

        // Recalculate roll.data from actor, if UUID was included
        //@ts-expect-error ignore
        if (obj._actorUuid) {
            const actor = fromUuidSync(
                //@ts-expect-error ignore
                obj._actorUuid
            ) as Actor.Implementation | null;
            if (actor) (roll as any).data = actor.getRollData();
        }

        return roll as any;
    }

    if (obj && typeof obj === "object" && "valueUuid" in obj) {
        const { value, type } = obj.valueUuid;
        const document = fromUuidSync(value);

        if (type === "document") {
            return document as any;
        }

        if (type === "object" && document && "object" in document) {
            return document.object as any;
        }

        throw new Error(
            `Unknown or invalid type '${type}' during deserialization`
        );
    }

    if (
        typeof obj === "object" &&
        obj !== null &&
        !("uuid" in obj) &&
        !(obj instanceof foundry.canvas.placeables.Token)
    ) {
        const deserializedObject: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            deserializedObject[key] = deserialize(value);
        }
        return deserializedObject as any;
    }

    return obj as any;
}

function isSerializableRoll(obj: any): obj is Roll {
    return (
        obj != null &&
        typeof obj.toJSON === "function" &&
        Array.isArray(obj.dice)
    );
}
