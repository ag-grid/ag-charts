interface RingPath {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    closePath(): void;
}

/** Emits one closed polygon ring: a single `moveTo`, `n - 1` `lineTo` and one `closePath`. */
export function drawPolygonRing(path: RingPath, angles: readonly number[], radius: number) {
    for (let i = 0; i < angles.length; i++) {
        const angle = angles[i];
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) {
            path.moveTo(x, y);
        } else {
            path.lineTo(x, y);
        }
    }
    path.closePath();
}
