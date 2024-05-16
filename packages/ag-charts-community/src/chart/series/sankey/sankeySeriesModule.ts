import type { SeriesModule } from '../../../module/coreModules';
import { EXTENDS_SERIES_DEFAULTS } from '../../themes/symbols';
import { SankeySeries } from './sankeySeries';

export const SankeySeriesModule: SeriesModule<'sankey'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['flow-proportion'],

    identifier: 'sankey',
    instanceConstructor: SankeySeries,

    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                },
            },
            node: {
                spacing: 20,
                width: 10,
                strokeWidth: 0,
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: 0,
            },
        },
    },
    paletteFactory({ takeColors, colorsCount }) {
        const { fills, strokes } = takeColors(colorsCount);
        return {
            fills,
            strokes,
        };
    },
};
