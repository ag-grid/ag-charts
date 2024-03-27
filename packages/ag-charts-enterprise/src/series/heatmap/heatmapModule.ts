import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { HeatmapSeries } from './heatmapSeries';
import { HEATMAP_SERIES_THEME } from './heatmapThemes';

export const HeatmapModule: _ModuleSupport.SeriesModule<'heatmap'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'heatmap',
    instanceConstructor: HeatmapSeries,
    defaultAxes: [
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
            position: _Theme.POSITION.LEFT,
        },
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
            position: _Theme.POSITION.BOTTOM,
        },
    ],
    themeTemplate: HEATMAP_SERIES_THEME,
    paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const defaultColorRange = properties.get(_Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const defaultBackgroundColor = properties.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor) ?? 'white';
        const { fills, strokes } = takeColors(colorsCount);
        return {
            stroke: userPalette ? strokes[0] : backgroundFill,
            colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
        };
    },
};
