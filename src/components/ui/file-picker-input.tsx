import React, { useEffect, useRef } from "react";

interface FilePickerInputProps {
    /** The current file path */
    value: string;
    /** Called when the user picks a new file */
    onChange: (path: string) => void;
    /** Input name */
    name: string;
    /** File type: "image" | "audio" | "video" | "any" */
    type?: FilePicker.Type;
    /** If true, disallow uploads in the picker */
    noupload?: boolean;
    /** Extra wrapper classNames */
    className?: string;
}

export const FilePickerInput: React.FC<FilePickerInputProps> = ({
    value,
    onChange,
    name,
    type = "any",
    noupload = false,
    className,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (pickerRef.current) pickerRef.current.value = value;
    }, [value]);

    useEffect(() => {
        const picker =
            foundry.applications.elements.HTMLFilePickerElement.create({
                name,
                value,
                type,
                noupload,
            });

        picker.addEventListener("input", (evt) => {
            const target = evt.currentTarget as HTMLInputElement;
            onChange(target.value);
        });
        picker.className = "flex flex-row gap-4";
        const pickerClassList = className ?? "";
        const pickerClasses = pickerClassList.split(/\s+/);

        picker.classList.add(...pickerClasses);
        const wrapper = containerRef.current!;
        wrapper.innerHTML = "";
        wrapper.appendChild(picker);

        const classList =
            "file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-[inherit] flex-1 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis selection:bg-primary selection:text-primary-foreground";
        const classes = classList.split(/\s+/);

        picker.children[0].classList.add(...classes);
        picker.children[0].id = name;

        requestAnimationFrame(() => {
            (picker.children[0] as HTMLInputElement).blur();
        });

        picker.children[1].classList.add(
            "self-stretch",
            "rounded-md",
            "bg-inherit",
            "m-0",
            "p-0",
            "h-9",
            "w-9",
            "border-1",
            "inline-flex",
            "items-center",
            "justify-center",
            "gap-2",
            "whitespace-nowrap",
            "rounded-md",
            "text-sm",
            "font-medium",
            "transition-all",
            "disabled:pointer-events-none",
            "disabled:opacity-50",
            "[&_svg]:pointer-events-none",
            "[&_svg:not([class*=size-])]:size-4",
            "shrink-0",
            "[&_svg]:shrink-0",
            "outline-none",
            "focus-visible:border-ring",
            "focus-visible:ring-ring/50",
            "focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20",
            "dark:aria-invalid:ring-destructive/40",
            "aria-invalid:border-destructive",
            "border",
            "bg-background",
            "shadow-xs",
            "hover:bg-accent",
            "hover:text-accent-foreground",
            "dark:bg-input/30",
            "dark:border-input",
            "dark:hover:bg-input/50",
            "aspect-square"
        );

        pickerRef.current = picker.children[0] as HTMLInputElement;

        return () => {
            picker.remove();
        };
    }, [name, noupload, onChange, type, value]);

    return <div ref={containerRef} className={className} />;
};
