export function registerGroupRollsStore() {
    game.settings.register("aeris-bg3-rolls", "groupRolls", {
        scope: "world",
        config: false,
        default: [],
    });
}
