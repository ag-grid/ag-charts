import type { SeriesModule } from '../../../module/coreModules';
import { singleSeriesPaletteFactory } from '../../../module/theme';
import { CARTESIAN_AXIS_TYPE, FONT_WEIGHT, POSITION } from '../../themes/constants';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
    DEFAULT_SHADOW_COLOUR,
    EXTENDS_SERIES_DEFAULTS,
} from '../../themes/symbols';
import { BarSeries } from './barSeries';

export const BarSeriesModule: SeriesModule<'bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'bar',
    instanceConstructor: BarSeries,
    stackable: true,
    groupable: true,
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.BOTTOM,
        },
    ],
    swapDefaultAxesCondition: (series) => series?.direction === 'horizontal',
    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            direction: 'vertical',
            fillOpacity: 1,
            strokeWidth: 0,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: false,
                fontStyle: undefined,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                formatter: undefined,
                placement: 'inside',
            },
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
        },
    },
    enterpriseThemeTemplate: {
        series: {
            errorBar: {
                cap: {
                    lengthRatio: 0.3,
                },
            },
        },
    },
    paletteFactory: singleSeriesPaletteFactory,
};
