import type { AgCartesianChartOptions } from 'ag-charts-types';

import type { SeriesPaletteFactoryParams } from '../../module/coreModulesTypes';
import { Color } from '../../util/color';
import { mapValues } from '../../util/object';

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
        sequentialColors: [defaultColorRange],
    } = takeColors(1);

    return { fill, stroke, defaultColorRange };
}

export function markerPaletteFactory(params: SeriesPaletteFactoryParams) {
    return { marker: singleSeriesPaletteFactory(params) };
}

export function getSequentialColors(colors: { [key: string]: string }) {
    return mapValues(colors, (value) => {
        const color = Color.fromString(value);
        return [Color.darken(color, 0.15).toString(), value, Color.lighten(color, 0.15).toString()];
    });
}
