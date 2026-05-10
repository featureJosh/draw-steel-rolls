interface GroupRollAdapter<Cfg> {
    getRollTypes(): { id: string; label: string; config: Cfg }[];

    renderRollTypeSelector(
        value: Cfg | undefined,
        onChange: (cfg: Cfg | undefined) => void
    ): React.ReactNode;

    buildRequest(
        actor: Actor,
        config: Cfg
    ): PendingIndividualRollRequest & { config: Cfg };
    execute(
        request: PendingIndividualRollRequest & { config: Cfg }
    ): Promise<Roll>;

    getLabel(config: Cfg): string;
}
