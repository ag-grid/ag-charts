import type { SeriesModule } from '../../../util/coreModules';
import { singleSeriesPaletteFactory } from '../../../util/theme';
import type { AgBarSeriesOptions } from '../../../options/agChartOptions';
import { BarSeries } from './barSeries';
import { DEFAULT_FONT_FAMILY, DEFAULT_SHADOW_COLOUR, EXTENDS_SERIES_DEFAULTS } from '../../themes/symbols';
import { NumberAxis } from '../../axis/numberAxis';
import { CategoryAxis } from '../../axis/categoryAxis';
import { NORMAL } from '../../themes/constants';

export const BarSeriesModule: SeriesModule<'bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'bar',
    instanceConstructor: BarSeries,
    stackable: true,
    groupable: true,
    seriesDefaults: {
        axes: [
            {
                type: NumberAxis.type,
                position: 'bottom',
            },
            {
                type: CategoryAxis.type,
                position: 'left',
            },
        ],
    },
    swapDefaultAxesCondition: (opts) => (opts.series?.[0] as AgBarSeriesOptions)?.direction !== 'horizontal',
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS,
        fillOpacity: 1,
        strokeWidth: 0,
        lineDash: [0],
        lineDashOffset: 0,
        label: {
            enabled: false,
            fontStyle: undefined,
            fontWeight: NORMAL,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: 'white',
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
    paletteFactory: singleSeriesPaletteFactory,
};
