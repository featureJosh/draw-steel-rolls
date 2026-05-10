type Serialized<T> = {
    [K in keyof T as T[K] extends { uuid: string }
        ? `${string & K}Uuid`
        : T[K] extends { document: { uuid: string } }
        ? `${string & K}Uuid`
        : K]: T[K] extends { uuid: string }
        ? string
        : T[K] extends { document: { uuid: string } }
        ? string
        : T[K] extends object
        ? Serialized<T[K]>
        : T[K];
};

type Unserialized<T> = {
    [K in keyof T as K extends `${infer Base}Uuid`
        ? Base // drop the suffix
        : K]: K extends `${infer Base}Uuid`
        ? { uuid: T[K] } // reconstruct object
        : T[K] extends object
        ? Unserialized<T[K]> // recurse
        : T[K];
};
