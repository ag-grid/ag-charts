export const COLUMNS = 40;
export const ROWS = 24;

export interface HeatmapDatum {
    id: string;
    time: string;
    band: string;
    level: number;
}

export function getData(): HeatmapDatum[] {
    const data: HeatmapDatum[] = [];
    for (let x = 0; x < COLUMNS; x++) {
        for (let y = 0; y < ROWS; y++) {
            data.push({ id: `${x}:${y}`, time: `T${x}`, band: `B${y}`, level: (x * 7 + y * 13) % 100 });
        }
    }
    return data;
}
