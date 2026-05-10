import { DependencyList, useEffect } from "react";

export function useHookEvent<K extends Hooks.HookName>(
    event: K,
    handler: Hooks.Function<K>,
    deps: DependencyList = []
) {
    useEffect(() => {
        Hooks.on(event, handler);
        return () => Hooks.off(event, handler);
    }, deps);
}
