import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import Lenis from "lenis";
import * as React from "react";

import { cn } from "@/lib/utils";

function ScrollArea({
    className,
    children,
    smooth = true,
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
    smooth?: boolean;
}) {
    const viewportRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!smooth || !viewportRef.current) return;

        const viewport = viewportRef.current;
        const content = viewport.firstElementChild as HTMLElement | null;
        if (!content) return;

        const lenis = new Lenis({
            wrapper: viewport,
            content,
            autoRaf: true,
        });

        return () => lenis.destroy();
    }, [smooth]);

    return (
        <ScrollAreaPrimitive.Root
            data-slot="scroll-area"
            className={cn("relative", className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                ref={viewportRef}
                data-slot="scroll-area-viewport"
                className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar className="border-0" />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
}

function ScrollBar({
    className,
    orientation = "vertical",
    style,
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
    return (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
            data-slot="scroll-area-scrollbar"
            orientation={orientation}
            className={cn(
                "flex touch-none p-px transition-colors select-none",
                orientation === "vertical" &&
                    "h-full w-1.5 border-l border-l-transparent",
                orientation === "horizontal" &&
                    "h-2.5 flex-col border-t border-t-transparent",
                className
            )}
            style={{ ...style }}
            {...props}
        >
            <ScrollAreaPrimitive.ScrollAreaThumb
                data-slot="scroll-area-thumb"
                className="bg-border relative flex-1 rounded-full"
            />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
    );
}

export { ScrollArea, ScrollBar };
