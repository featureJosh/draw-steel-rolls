import { useDiceAnimation2 } from "@/hooks/use-dice-anim-2";
import { useGsapToggle } from "@/hooks/use-gsap-toggle";
import { useHookEvent } from "@/hooks/use-hook-event";
import { cn } from "@/lib/utils";
import { diceBoxManager } from "@/managers/dice-box-manager";
import { useRollStore } from "@/stores/group-roll-store";
import { getDiceOffsetCoordinates } from "@/utils/dice-offset-coordinates";
import { getModifierFromRoll } from "@/utils/get-modifier-from-roll";
import gsap from "gsap";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Material } from "three";
import { socketlibSocket } from "../../socket/_socket";
import { PlayerRollBorder } from "../svg/player-roll-border";
import { AdvIcons } from "./adv-icons";

interface RollOverlayPlayerRollProps {
    requestIndex: number;
    groupRollId: GroupRollId;
    actor: Actor;
    advantageMode: number;
    isVisible: boolean;
    rollData: InitiatedIndividualRollRequest;
}

const EMPTY_ARRAY: string[] = [];

export const RollOverlayPlayerRoll: React.FC<RollOverlayPlayerRollProps> = ({
    groupRollId,
    actor,
    advantageMode,
    isVisible,
    requestIndex,
    rollData,
}) => {
    const [color, setColor] = useState<string | undefined>(
        game.settings.get(`aeris-bg3-rolls`, `border-color`) ?? "#ffffff"
    );

    useHookEvent(`aeris-bg3-rolls.border-color`, (value) => {
        if (value) setColor(value);
    });

    const modifier = useMemo(
        () => getModifierFromRoll(rollData.roll),
        [rollData]
    );

    const diceIds = useRollStore(
        (s) => s.diceIdsByActor[actor.uuid as ActorUuid] ?? EMPTY_ARRAY
    );
    const rollResult = useRollStore(
        (s) => s.results[actor.uuid as ActorUuid] ?? null
    );

    const hideCanvas = useRollStore((s) => s.hideCanvas);

    const numberOfDie = 1 + Math.abs(Number(advantageMode));

    const modifierRef = useRef<HTMLDivElement>(null);

    const { elementRef, show, hide } = useGsapToggle({
        from: { duration: 0.75, y: 50, opacity: 0, ease: "expo.out" },
        to: { duration: 0.75, y: 0, opacity: 1, delay: requestIndex * 0.2 },
        onHidden: () => {
            hideCanvas();
        },
        onUpdate: () => {
            const y = gsap.getProperty(elementRef.current, "y") as number;
            const opacity = gsap.getProperty(
                elementRef.current,
                "opacity"
            ) as number;
            diceIds.forEach((id, index) => {
                const mesh = diceBoxManager.getDie(id);
                if (mesh) {
                    const wiggleEnded = mesh.userData.wiggleEnded;

                    if (wiggleEnded) {
                        mesh.position.y =
                            mesh.userData.baseDomY -
                            Number(
                                getDiceOffsetCoordinates(index, diceIds.length)
                                    .top
                            ) *
                                2 -
                            y * 2;
                        mesh.position.x =
                            mesh.userData.baseDomX -
                            Number(
                                getDiceOffsetCoordinates(index, diceIds.length)
                                    .left
                            ) *
                                2;
                    } else {
                        mesh.position.y = mesh.userData.baseDomY - y * 2;
                    }
                }
                if (mesh?.material) {
                    const mat = mesh.material as Material & {
                        opacity?: number;
                        transparent?: boolean;
                    };
                    if ("opacity" in mat) {
                        mat.transparent = true;
                        mat.opacity = opacity;
                    }
                }
            });
        },
        withDiceBox: foundry.utils.randomID(),
    });

    useEffect(() => {
        if (isVisible) show();
        else hide();
    }, [isVisible, show, hide]);

    const handleRollClick = useCallback(async () => {
        if (!actor || !actor.isOwner) return;
        socketlibSocket.executeAsGM("handleTriggerRollForActor", {
            groupRollId,
            actorUuid: actor.uuid as ActorUuid,
        });
    }, [groupRollId, actor]);

    const configs = useMemo(() => {
        return Array.from({ length: numberOfDie }).map((_, index) => {
            return {
                id: diceIds[index],
                result: rollResult?.result[index] ?? 0,
                modified: rollResult?.modified[index] ?? 0,
            };
        });
    }, [diceIds, rollResult, numberOfDie]);

    useDiceAnimation2(
        diceIds,
        rollResult?.maxIndex ?? null,
        numberOfDie,
        groupRollId,
        actor,
        configs,
        modifierRef
    );

    return (
        <>
            <div
                className="flex items-center justify-center relative w-[120px] h-[120px] pointer-events-auto"
                onClick={handleRollClick}
            >
                <div ref={elementRef}>
                    <AdvIcons advantageMode={advantageMode} />
                    {actor.img && (
                        <img
                            className="absolute object-cover opacity-60 z-10 [mask-image:url('/modules/aeris-bg3-rolls/assets/player-roll-border-mask.svg')] [mask-repeat:no-repeat] [mask-position:center]"
                            src={actor.img}
                        />
                    )}
                    <PlayerRollBorder className="opacity-80" color={color} />
                    {modifier !== 0 && (
                        <div
                            ref={modifierRef}
                            className={cn(
                                "absolute top-[80px] left-[86px] -translate-x-1/2 rounded-sm font-black text-base z-20 px-0.5"
                            )}
                        >
                            {modifier > 0 ? `+${modifier}` : modifier}
                        </div>
                    )}
                    <div className="absolute left-1/2 top-[115px] -translate-x-1/2 -translate-y-1/2 text-[15px] font-bold text-center text-white z-[12]">
                        {actor.name?.split(" ")[0] ?? ""}
                    </div>
                </div>
            </div>
        </>
    );
};
