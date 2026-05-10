import { requestGroupRoll } from "@/api";
import { getGroupRollManager } from "@/apps/group-roll-manager";

export const api = {
    requestGroupRoll,
    openGroupRollManager: () => {
        if (!game.user.isGM) return;
        const cls = getGroupRollManager();
        if (cls) {
            //@ts-expect-error abstract (idk why)
            const app = new cls();
            app.render({ force: true });
        }
    },
};
