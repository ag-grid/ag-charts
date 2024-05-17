import type { SeriesModule } from '../../../module/coreModules';
import { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, EXTENDS_SERIES_DEFAULTS } from '../../themes/symbols';
import { ChordSeries } from './chordSeries';

export const ChordSeriesModule: SeriesModule<'chord'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['flow-proportion'],

    identifier: 'chord',
    instanceConstructor: ChordSeries,

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
                spacing: 5,
                maxWidth: 100,
            },
            node: {
                spacing: 8,
                height: 10,
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
