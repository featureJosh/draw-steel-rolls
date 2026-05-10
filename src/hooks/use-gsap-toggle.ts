import { diceBoxManager } from "@/managers/dice-box-manager";
import { debug } from "@/utils/logging";
import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

export const useGsapToggle = (
    opts: {
        from?: gsap.TweenVars;
        to?: gsap.TweenVars;
        onHidden?: () => void;
        onShown?: () => void;
        onUpdate?: (progress: number, el: HTMLElement) => void;
        withDiceBox?: string;
    } = {
        from: {},
        to: {},
    }
) => {
    const elementRef = useRef<HTMLDivElement>(null);

    const [isVisible, setIsVisible] = useState(false);

    const tlRef = useRef<gsap.core.Timeline>(null);

    const buildTimeline = () => {
        tlRef.current?.kill();
        if (opts.withDiceBox) diceBoxManager.stopAnimating(opts.withDiceBox);

        const tl = gsap.timeline({
            onStart: () => {
                if (opts.withDiceBox)
                    diceBoxManager.startAnimating(opts.withDiceBox);
            },
            onComplete: () => {
                if (opts.withDiceBox)
                    diceBoxManager.stopAnimating(opts.withDiceBox);
            },
            onInterrupt: () => {
                if (opts.withDiceBox)
                    diceBoxManager.stopAnimating(opts.withDiceBox);
            },
        });
        tlRef.current = tl;
        return tl;
    };

    useEffect(() => {
        if (elementRef) gsap.set(elementRef.current, { ...(opts.from || {}) });
    }, []);

    const show = useCallback(() => {
        if (!elementRef.current) return;

        debug("show");

        setIsVisible(true);

        const tl = buildTimeline();
        tl.to(elementRef.current, {
            ...(opts.to || {}),
            overwrite: true,
            onStart: () => {
                opts.onShown?.();
            },
            onUpdate: () => {
                if (opts.onUpdate && elementRef.current) {
                    const progress = tl.progress();
                    opts.onUpdate(progress, elementRef.current);
                }
            },
        });
    }, [opts]);

    const hide = useCallback(() => {
        if (!elementRef.current) return;

        const tl = buildTimeline();
        tl.to(elementRef.current, {
            ...(opts.from || {}),
            onUpdate: () => {
                if (opts.onUpdate && elementRef.current) {
                    const progress = tl.progress();
                    opts.onUpdate(progress, elementRef.current);
                }
            },
            onComplete: () => {
                opts.onHidden?.();
                setIsVisible(false);
            },
            overwrite: true,
        });
    }, [opts]);

    return { elementRef, show, hide, isVisible };
};
