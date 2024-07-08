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
    tooltipDefaults: { range: 'exact' },
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
        const defaultColorRange = themeTemplateParameters.get(_Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const defaultBackgroundColor = themeTemplateParameters.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor) ?? 'white';
        const { fills, strokes } = takeColors(colorsCount);
        return {
            stroke: userPalette === 'inbuilt' ? backgroundFill : strokes[0],
            colorRange: userPalette === 'inbuilt' ? defaultColorRange : [fills[0], fills[1]],
        };
    },
};
