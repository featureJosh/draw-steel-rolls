export function isEmptyObject(obj: unknown): boolean {
    return !!obj && typeof obj === "object" && Object.keys(obj).length === 0;
}
