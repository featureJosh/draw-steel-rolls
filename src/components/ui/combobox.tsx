"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./scroll-area";

export type ComboboxItem<T> = {
    data: T;
    getValue: (item: T) => string;
    getLabel: (item: T) => string;
};

interface GenericComboboxProps<T> {
    items: ComboboxItem<T>[];
    value: T | undefined;
    onValueChange: (value: T | undefined) => void;
    placeholder?: string;
    enableSearch?: boolean;
    className?: string;
}

export function Combobox<T>({
    items,
    value,
    onValueChange,
    placeholder = "Select…",
    enableSearch = true,
    className,
}: GenericComboboxProps<T>) {
    const [open, setOpen] = React.useState(false);
    // keep an internal “stringValue” to sync with CommandItem
    const stringValue =
        value === undefined
            ? ""
            : items.find((it) => it.data === value)?.getValue(value) ?? "";

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(`w-full justify-between`, className)}
                >
                    {value
                        ? items.find((it) => it.data === value)?.getLabel(value)
                        : placeholder}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0">
                <Command>
                    {enableSearch && (
                        <CommandInput placeholder="Search…" className="h-9" />
                    )}
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandGroup>
                        <ScrollArea className="h-[300px] pr-2" smooth={false}>
                            {items.map(({ data, getValue, getLabel }) => {
                                const itemValue = getValue(data);
                                return (
                                    <CommandItem
                                        key={itemValue}
                                        value={`${itemValue} ${getLabel(data)}`}
                                        onSelect={(current) => {
                                            if (current === stringValue) {
                                                onValueChange(undefined);
                                            } else {
                                                const picked = items.find(
                                                    (it) =>
                                                        it.getValue(it.data) ===
                                                        itemValue
                                                )!;
                                                onValueChange(picked.data);
                                            }
                                            setOpen(false);
                                        }}
                                    >
                                        {getLabel(data)}
                                        <Check
                                            className={cn(
                                                "ml-auto",
                                                stringValue === itemValue
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                );
                            })}
                        </ScrollArea>
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
