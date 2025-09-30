import type { AgChartThemePalette } from 'ag-charts-types';

export type PaletteType = 'inbuilt' | 'user-indexed' | 'user-full';

export function paletteType(partial?: AgChartThemePalette): PaletteType {
    if (partial?.up || partial?.down || partial?.neutral) {
        return 'user-full';
    } else if (partial?.fills || partial?.strokes) {
        return 'user-indexed';
    }
    return 'inbuilt';
}
