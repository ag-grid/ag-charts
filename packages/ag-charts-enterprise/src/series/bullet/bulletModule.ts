import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { BULLET_DEFAULTS } from './bulletDefaults';
import { BulletSeries } from './bulletSeries';
import { BULLET_SERIES_THEME } from './bulletThemes';

const { deepClone, isNumber } = _ModuleSupport;

export const BulletModule: _ModuleSupport.SeriesModule<'bullet'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    solo: true,
    instanceConstructor: BulletSeries,
    seriesDefaults: ({ scale }) => {
        const seriesDefaults = deepClone(BULLET_DEFAULTS);
        if (scale && isNumber(scale.max)) {
            seriesDefaults.axes[0].max = scale.max;
        }
        return seriesDefaults;
    },
    themeTemplate: BULLET_SERIES_THEME,
    swapDefaultAxesCondition: (series) => series?.direction === 'horizontal',
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const themeBackgroundColor = themeTemplateParameters.properties.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? 'white';

        const defaultAxisLineColor = properties.get(_Theme.DEFAULT_AXIS_LINE_COLOUR);
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(colorsCount);
        return {
            fill,
            stroke,
            target: {
                stroke: defaultAxisLineColor,
                fill: backgroundFill,
            },
        };
    },
};
