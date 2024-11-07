import type { AgCartesianChartOptions } from 'ag-charts-types';

import type { SeriesPaletteFactoryParams } from '../../module/coreModulesTypes';

type CartesianAxis = Exclude<AgCartesianChartOptions['axes'], undefined>[0];

export function swapAxisCondition(axes: [CartesianAxis, CartesianAxis], swap: (series: any) => boolean) {
    return (series: any) => {
        if (!swap(series)) return axes;

        return [
            { ...axes[0], position: axes[1].position },
            { ...axes[1], position: axes[0].position },
        ];
    };
}

export function singleSeriesPaletteFactory({ takeColors }: SeriesPaletteFactoryParams) {
    const {
        fills: [fill],
        strokes: [stroke],
    } = takeColors(1);
    return { fill, stroke };
}

export function markerPaletteFactory(params: SeriesPaletteFactoryParams) {
    return { marker: singleSeriesPaletteFactory(params) };
}
