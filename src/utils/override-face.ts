import { diceBoxManager, getAppearance } from "@/managers/dice-box-manager";
import { MaterialData } from "@/types/dsn";
import { Material, Mesh } from "three";
import { faceQuats } from "./dsn";

export function overrideDieFaceLabel(
    mesh: Mesh,
    type: keyof typeof faceQuats,
    actor: Actor,
    faceIndex: number,
    newValue: string
) {
    const savedMaterial: Material | undefined = mesh.userData.modifierMaterial;
    if (savedMaterial) {
        const oldMaterials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

        mesh.material = savedMaterial;
        oldMaterials.forEach((m) => m.dispose());
    } else {
        const generated = generateMaterial(
            mesh,
            type,
            actor,
            faceIndex,
            newValue
        );
        if (!generated) return;
        const { oldMaterials, newMaterial } = generated;
        mesh.material = newMaterial;

        oldMaterials.forEach((m) => m.dispose());
    }
}

function generateMaterial(
    mesh: Mesh,
    type: keyof typeof faceQuats,
    actor: Actor,
    faceIndex: number,
    newValue: string
) {
    const diceFactory = diceBoxManager.getFactory();
    if (!diceFactory) return;

    const user: User =
        game.users?.find((u) => u.character?.uuid === actor.uuid) ??
        game.users?.find((u) => u.isGM) ??
        game.user!;

    const appearance = getAppearance(user, type, diceFactory);

    // Recreate the dice object
    let diceobj = diceFactory.getPresetBySystem(type, appearance.system);
    if (!diceobj) return;

    // Clone labels so we don’t mutate the preset
    let newLabels = [...diceobj.labels];
    if (faceIndex >= 0 && faceIndex < newLabels.length) {
        newLabels[faceIndex] = newValue;
    }

    const oldMaterials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

    diceobj.labels = newLabels;

    let oldMaterialData: MaterialData;
    if (Array.isArray(mesh.material)) {
        oldMaterialData = mesh.material[0].userData?.materialData;
    } else {
        oldMaterialData = mesh.material.userData?.materialData;
    }

    const materialData = diceFactory.generateMaterialData(diceobj, appearance);

    if (oldMaterialData) {
        // Preserve colors
        materialData.foreground =
            oldMaterialData.foreground ?? materialData.foreground;
        materialData.background =
            oldMaterialData.background ?? materialData.background;
        materialData.outline = oldMaterialData.outline ?? materialData.outline;
        materialData.edge = oldMaterialData.edge ?? materialData.edge;

        materialData.material =
            oldMaterialData.material ?? materialData.material;

        // Preserve font / scale / ghost state
        materialData.font = oldMaterialData.font ?? materialData.font;
        materialData.fontScale =
            oldMaterialData.fontScale ?? materialData.fontScale;
        materialData.isGhost = oldMaterialData.isGhost ?? materialData.isGhost;
    }

    // Create new cache key (must be unique to force refresh)
    let baseMaterialCacheString = foundry.utils.randomID();

    const scopedTextureCache =
        diceBoxManager.getBox()!.renderer.scopedTextureCache;

    // Create new material
    let newMaterial = diceFactory.createMaterial(
        scopedTextureCache,
        baseMaterialCacheString,
        diceobj,
        materialData
    );

    const processed = diceFactory.systems
        .get(appearance.system)
        ?.processMaterial(type, newMaterial, appearance);

    if (processed) newMaterial = processed;

    if (Array.isArray(mesh.material)) {
        newMaterial.onBeforeCompile = mesh.material[0].onBeforeCompile;
    } else {
        newMaterial.onBeforeCompile = mesh.material.onBeforeCompile;
    }

    return { newMaterial, oldMaterials };
}
