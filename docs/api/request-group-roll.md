### `aerisBg3Rolls.requestGroupRoll`

```ts
aerisBg3Rolls.requestGroupRoll(
  initiated: {
    id: string;
    status: "initiated";
    img?: string;
    promptHeader?: string;
    promptSubheader?: string;
    targetValue?: number;
    rollConfig?: any;
    rolls: {
      actor: Actor;
      roll: Roll.Evaluated<Roll>;
    }[];
  }
): Promise<Roll.Evaluated<Roll>[]>
```

High-level helper for executing a **Group Roll**.

-   Shows the group roll overlay for all players.
-   Returns the evaluated rolls (`Roll.Evaluated<Roll>`) for each actor, in order.
-   Dice animations are hidden after completion.

#### Returns

-   `Promise<Roll.Evaluated<Roll>[]>` — one evaluated roll per actor.

#### Example

```js
const actors = canvas.tokens.controlled.map((t) => t.actor).filter((a) => a);
if (!actors.length) {
    ui.notifications.warn("No tokens selected.");
    return;
}

// build initiated group roll
const initiated = {
    id: foundry.utils.randomID(),
    status: "initiated",
    promptHeader: "Dexterity Saving Throw",
    promptSubheader: "Collapsing bridge",
    img: "icons/skills/movement/feet-winged-boots-brown.webp",
    targetValue: 15,
    rolls: await Promise.all(
        actors.map(async (actor) => {
            const roll = await new Roll(
                "1d20 + @abilities.dex.mod",
                actor.getRollData()
            ).evaluate();
            return { actor, roll };
        })
    ),
};

// trigger the cinematic group roll
const result = await aerisBg3Rolls.requestGroupRoll(initiated);

console.log("Resolved rolls:", result);
```
