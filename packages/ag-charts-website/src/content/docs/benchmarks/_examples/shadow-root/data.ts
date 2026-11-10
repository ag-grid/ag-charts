function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

const random = sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, 75023847123 ^ 0xdeadbeef);

/** Rows of `{ x, y0 ... y<seriesCount - 1> }`, each series a random walk, so that series overlap one another. */
export function getRows(pointCount: number, seriesCount: number, categorical: boolean) {
    const levels = Array.from({ length: seriesCount }, (_, s) => 40 + s * 2);
    const rows: Record<string, number | string>[] = [];
    for (let i = 0; i < pointCount; i++) {
        const row: Record<string, number | string> = { x: categorical ? `Category ${i + 1}` : i };
        for (let s = 0; s < seriesCount; s++) {
            levels[s] = Math.max(1, levels[s] + random() * 10 - 5);
            row[`y${s}`] = Math.round(levels[s] * 100) / 100;
        }
        rows.push(row);
    }
    return rows;
}

/** Rows of `{ x, y, level }` for a `columns` x `rows` heatmap, with `level` rising smoothly across the cells. */
export function getHeatmapRows(columns: number, rows: number) {
    const cells: { x: string; y: string; level: number }[] = [];
    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
            cells.push({ x: `C${x}`, y: `R${y}`, level: Math.round((Math.sin(x / 7 + y / 9) + 1) * 50) });
        }
    }
    return cells;
}
