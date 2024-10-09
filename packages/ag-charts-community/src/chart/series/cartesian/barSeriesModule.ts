import type { SeriesModule } from '../../../module/coreModules';
import { singleSeriesPaletteFactory } from '../../../module/theme';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION, FONT_WEIGHT } from '../../themes/constants';
import { DEFAULT_FONT_FAMILY, DEFAULT_INSIDE_SERIES_LABEL_COLOUR, DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { swapAxisCondition } from '../../themes/util';
import { BarSeries } from './barSeries';

export const BarSeriesModule: SeriesModule<'bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'bar',
    moduleFactory: (ctx) => new BarSeries(ctx),
    stackable: true,
    groupable: true,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: swapAxisCondition(
        [
            { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
            { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
    themeTemplate: {
        series: {
            direction: 'vertical',
            fillOpacity: 1,
            strokeWidth: 0,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: false,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                placement: 'inside',
            },
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
            errorBar: {
                cap: {
                    lengthRatio: 0.3,
                },
            },
        },
    },
    paletteFactory: singleSeriesPaletteFactory,
};
