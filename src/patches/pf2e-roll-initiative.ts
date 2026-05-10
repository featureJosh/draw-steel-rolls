// import { requestGroupRoll, UnconfiguratedGroupRollConfig } from "../api/api";
// import { log } from "../utils/logging";

// export function setupPatchPF2ERollInitiative() {
//     // Grab the original method once
//     const proto = CONFIG.Combat.documentClass.prototype;
//     const _origRollInit = proto.rollInitiative as (
//         ids: string[],
//         options?: RollInitiativeOptionsPF2e
//     ) => Promise<any>;

//     // Replace it
//     proto.rollInitiative = async function (
//         ids: string[],
//         //@ts-expect-error untyped
//         options: RollInitiativeOptionsPF2e = {}
//     ): Promise<any> {
//         log("Roll initiative");

//         // 1) PF2e‐enabled combatants
//         const combatants = ids
//             .map((id) => this.combatants.get(id))
//             .filter((c) => !!c?.actor?.initiative) as CombatantPF2e[];
//         const remainingIds = ids.filter(
//             (id) => !combatants.some((c) => c.id === id)
//         );

//         const rollEntries = await Promise.all(
//             combatants.map(async (c) => {
//                 const result = await c.actor!.initiative!.roll({
//                     ...options,
//                     combatant: c,
//                     updateTracker: false,
//                     createMessage: false,
//                 });
//                 return {
//                     actorUuid: c.actor!.uuid,
//                     roll: result.roll, // if `roll()` returns an object with `.roll`
//                 };
//             })
//         );

//         // 2) If any, run your group‐roll
//         if (combatants.length) {
//             const stub: UnconfiguratedGroupRollConfig = {
//                 img: "icons/svg/d20.svg",
//                 promptHeader: game.i18n.localize("PF2E.Combat.RollInitiative"),
//                 type: "initiative",
//                 targetValue: undefined as any,
//                 rolls: rollEntries,
//             };

//             const evals = await requestGroupRoll(stub);

//             const initiatives = evals.map((er, i) => {
//                 const c = combatants[i];
//                 const stat =
//                     er.options.domains?.find(
//                         (d): d is SkillSlug | "perception" =>
//                             d === "perception" || d in CONFIG.PF2E.skills
//                     ) ?? null;
//                 return {
//                     id: c.id,
//                     value: er.total,
//                     statistic: stat,
//                 };
//             });

//             await (this as any).setMultipleInitiatives(initiatives);
//         }

//         // 3) Call the original for any leftovers
//         return _origRollInit.call(this, remainingIds, options);
//     };
// }
