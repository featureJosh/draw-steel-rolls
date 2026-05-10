// import { requestGroupRoll, UnconfiguratedGroupRollConfig } from "../api/api";
// import { ActorUuid } from "../models/actor5e";

// export function setupPatchCombatRollInitiative() {
//     Combat.prototype.rollInitiative = async function (
//         ids: string | string[] | undefined,
//         {
//             formula = null,
//             updateTurn = true,
//             messageOptions = {},
//         }: {
//             formula?: string | null;
//             updateTurn?: boolean;
//             messageOptions?: Record<string, any>;
//         } = {}
//     ): Promise<Combat> {
//         // — Collect target combatants

//         ids = typeof ids === "string" ? [ids] : ids;
//         const currentId = this.combatant?.id;
//         const chatRollMode = game.settings?.get("core", "rollMode");

//         const combatants = ids
//             ?.map((id) => this.combatants.get(id))
//             .filter((c) => c?.isOwner) as Combatant[];

//         if (!combatants?.length) return this;

//         const stub: UnconfiguratedGroupRollConfig = {
//             img: "icons/svg/d20.svg",
//             promptHeader: game.i18n!.localize("COMBAT.RollsInitiative"),
//             type: "initiative",
//             rolls: combatants.map((c) => ({
//                 actorUuid: c.actor!.uuid as ActorUuid,
//                 roll: c.getInitiativeRoll(formula!),
//             })),
//         };

//         // — Fire off the group-roll UI + GM collection
//         const evaluatedRolls = await requestGroupRoll(stub);

//         // — Now apply the results back to each combatant & build ChatData
//         const updates: { _id: string; initiative: number }[] = [];
//         const messages: any[] = [];

//         for (let i = 0; i < combatants.length; i++) {
//             const c = combatants[i];
//             const roll = evaluatedRolls[i];
//             const total = roll.total;
//             updates.push({ _id: c.id!, initiative: total });

//             // reconstruct the ChatMessage data nearly exactly as the original
//             const speaker = ChatMessage.getSpeaker({
//                 actor: c.actor,
//                 token: c.token,
//                 alias: c.name,
//             });
//             const flavor = game.i18n!.format("COMBAT.RollsInitiative", {
//                 name: c.name,
//             });
//             const chatData = await roll.toMessage(
//                 {
//                     speaker,
//                     flavor,
//                     flags: { "core.initiativeRoll": true },
//                     ...messageOptions,
//                 },
//                 { create: false }
//             );
//             chatData.rollMode =
//                 messageOptions.rollMode ??
//                 (c.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode);
//             if (i > 0) chatData.sound = null;
//             messages.push(chatData);
//         }

//         // — Bulk‐update initiative totals
//         await this.updateEmbeddedDocuments("Combatant", updates);

//         // — Keep the turn on the same combatant if requested
//         if (updateTurn && currentId) {
//             const turnIndex = this.turns.findIndex((t) => t.id === currentId);
//             await this.update({ turn: turnIndex });
//         }

//         // — Post all ChatMessages
//         await ChatMessage.implementation.create(messages);

//         return this;
//     };
// }
