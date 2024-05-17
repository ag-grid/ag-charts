import type { SeriesModule } from '../../../module/coreModules';
import { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, EXTENDS_SERIES_DEFAULTS } from '../../themes/symbols';
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
            label: {
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                fontSize: 12,
                spacing: 10,
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
