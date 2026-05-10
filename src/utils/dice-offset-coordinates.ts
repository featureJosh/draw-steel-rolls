export function getDiceOffsetCoordinates(
    index: number,
    total: number
): { top: number; left: number; scale: string } {
    const baseZoom = 1;

    if (total === 1) {
        return {
            top: 0,
            left: 0,
            scale: baseZoom.toString(),
        };
    }

    const scale = (baseZoom / Math.sqrt(total)).toFixed(2);
    const angle = (360 / total) * index - 30;
    const radius = 15 + total * 3;

    const left = radius * Math.cos((angle * Math.PI) / 180) * (120 / 100);
    const top = -radius * Math.sin((angle * Math.PI) / 180) * (120 / 100);

    return {
        top,
        left,
        scale,
    };
}
