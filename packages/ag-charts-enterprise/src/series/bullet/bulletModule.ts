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
    defaultAxes: (series) =>
        series?.direction === 'horizontal'
            ? [
                  { type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER, position: _Theme.POSITION.BOTTOM },
                  { type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY, position: _Theme.POSITION.LEFT },
              ]
            : [
                  { type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER, position: _Theme.POSITION.LEFT },
                  { type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY, position: _Theme.POSITION.BOTTOM },
              ],
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
