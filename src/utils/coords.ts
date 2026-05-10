export function domToScenePosition(rect: DOMRect) {
    // center of the DOM element in pixels
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // offset so (0,0) is screen center
    const cx = x - window.innerWidth / 2;
    const cy = -(y - window.innerHeight / 2); // invert Y so up is positive

    return { x: cx * 2, y: cy * 2, z: 0 };
}
