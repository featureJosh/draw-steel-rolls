import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { FilePickerInput } from "../ui/file-picker-input";

export interface GroupRollEditorProps<Cfg> {
    groupRoll: PendingGroupRoll<Cfg>;
    adapter: GroupRollAdapter<Cfg>;
    onSave: (rollData: Omit<PendingGroupRoll<Cfg>, "id" | "status">) => void;
    onCancel: () => void;
}

export function GroupRollEditor<Cfg>({
    groupRoll,
    adapter,
    onSave,
    onCancel,
}: GroupRollEditorProps<Cfg>) {
    const [rollConfig, setRollConfig] = useState<Cfg | undefined>(
        groupRoll.rollConfig
    );
    const [header, setHeader] = useState<string>(groupRoll.promptHeader ?? "");
    const [dc, setDC] = useState<number>(groupRoll.targetValue ?? 0);
    const [image, setImage] = useState<string>(groupRoll.img ?? "");

    useEffect(() => {
        if (groupRoll) {
            setHeader(groupRoll.promptHeader ?? "");
        } else {
            setHeader("");
        }
    }, [groupRoll]);

    const handleSave = () => {
        if (!rollConfig) return;
        onSave({
            promptHeader: header.trim(),
            targetValue: dc,
            rolls: groupRoll.rolls,
            rollConfig,
            img: image,
        });
    };

    const handleCancel = () => {
        setHeader("");
        onCancel();
    };

    const isValid = !!header.trim();

    const rollTypeSelector = useMemo(
        () => adapter.renderRollTypeSelector(rollConfig, setRollConfig),
        [adapter, rollConfig]
    );

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold">
                {groupRoll ? "Edit Group Roll" : "Create Group Roll"}
            </h2>
            <p className="text-sm text-muted-foreground">
                Configure the group roll settings.
            </p>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="header">Title *</Label>
                    <Input
                        id="header"
                        placeholder="e.g. Jump The Bridge"
                        value={header}
                        onChange={(e) => setHeader(e.target.value)}
                    />
                </div>

                {rollTypeSelector}

                <div className="space-y-2">
                    <Label htmlFor="dc">DC *</Label>
                    <Input
                        id="dc"
                        placeholder="10"
                        value={dc}
                        type="number"
                        onChange={(e) => setDC(Number(e.target.value) || 0)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="backgroundImage">Background Image</Label>
                    <FilePickerInput
                        name="backgroundImage"
                        value={image}
                        onChange={(e) => setImage(e)}
                        className="gap-4"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button onClick={handleSave} disabled={!isValid}>
                    {groupRoll ? "Update Roll" : "Create Roll"}
                </Button>
            </div>
        </div>
    );
}
