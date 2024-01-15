import { _ModuleSupport, _Theme, _Util } from 'ag-charts-community';

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
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(colorsCount);
        const themeBackgroundColor = themeTemplateParameters.properties.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? 'white';

        const targetStroke = properties.get(_Theme.DEFAULT_CROSS_LINES_COLOUR);
        const colorRangeColor = _Util.Color.interpolate(fill, backgroundFill)(0.7);
        return {
            fill,
            stroke,
            target: { stroke: targetStroke },
            colorRanges: [{ color: colorRangeColor }],
        };
    },
};
