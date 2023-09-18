import type { SeriesModule } from '../../../util/coreModules';
import type { AgBarSeriesOptions } from '../../../options/agChartOptions';
import { BarSeries } from './barSeries';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_SHADOW_COLOUR,
    EXTENDS_SERIES_DEFAULTS,
} from '../../themes/chartTheme';
import { NumberAxis } from '../../axis/numberAxis';
import { CategoryAxis } from '../../axis/categoryAxis';
import { singleSeriesPaletteFactory } from '../../mapping/defaults';

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
        strokeOpacity: 1,
        strokeWidth: 1,
        lineDash: [0],
        lineDashOffset: 0,
        label: {
            enabled: false,
            fontStyle: undefined,
            fontWeight: undefined,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: DEFAULT_LABEL_COLOUR,
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
