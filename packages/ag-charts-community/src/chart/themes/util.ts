import type { AgCartesianChartOptions } from 'ag-charts-types';

import type { SeriesPaletteFactoryParams } from '../../module/coreModulesTypes';
import { DEFAULT_COLOR_RANGE } from './symbols';

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

export function singleSeriesPaletteFactory({ takeColors, themeTemplateParameters }: SeriesPaletteFactoryParams) {
    const {
        fills: [fill],
        strokes: [stroke],
    } = takeColors(1);

    const defaultColorRange = themeTemplateParameters.get(DEFAULT_COLOR_RANGE);

    return { fill, stroke, defaultColorRange };
}

export function markerPaletteFactory(params: SeriesPaletteFactoryParams) {
    return { marker: singleSeriesPaletteFactory(params) };
}
