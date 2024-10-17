import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { BulletSeries } from './bulletSeries';
import { BULLET_SERIES_THEME } from './bulletThemes';

export const BulletModule: _ModuleSupport.SeriesModule<'bullet'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    solo: true,
    moduleFactory: (ctx) => new BulletSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: _Theme.swapAxisCondition(
        [
            { type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER, position: _Theme.CARTESIAN_POSITION.LEFT },
            { type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY, position: _Theme.CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
    themeTemplate: BULLET_SERIES_THEME,
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(colorsCount);
        const themeBackgroundColor = themeTemplateParameters.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? 'white';

        const targetStroke = themeTemplateParameters.get(_Theme.DEFAULT_CROSS_LINES_COLOUR);
        return {
            fill,
            stroke,
            target: { stroke: targetStroke },
            backgroundFill,
        };
    },
};
