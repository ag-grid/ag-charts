import type { AgChartThemeOptions, AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
    DEFAULT_HEATMAP_SERIES_COLOUR_RANGE,
    DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const palette: AgChartThemePalette = {
    fills: [
        '#4F81BD',
        '#F79646',
        '#468A51',
        '#4BACC6',
        '#CDBC21',
        '#8460AF',
        '#7B7B7B',
        '#A55492',
        '#73572E',
        '#D3504D',
    ],
    strokes: [
        '#74a8e6',
        '#ffbe70',
        '#6cb176',
        '#75d4ef',
        '#f6e559',
        '#aa86d8',
        '#a1a1a1',
        '#ce7ab9',
        '#997b52',
        '#ff7872',
    ],
};

export class DarkTheme extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: '#4F81BD',
            stroke: '#74a8e6',
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: '#F79646',
            stroke: '#ffbe70',
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: '#7B7B7B',
            stroke: '#a1a1a1',
        };
    }

    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            DarkTheme.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            DarkTheme.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, DarkTheme.getWaterfallSeriesDefaultTotalColors());

        result.properties.set(DEFAULT_LABEL_COLOUR, 'white');
        result.properties.set(DEFAULT_MUTED_LABEL_COLOUR, '#7D91A0');
        result.properties.set(DEFAULT_AXIS_GRID_COLOUR, '#545A6E');
        result.properties.set(DEFAULT_BACKGROUND_COLOUR, '#15181c');
        result.properties.set(DEFAULT_TREEMAP_TILE_BORDER_COLOUR, 'white');
        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, ['#4F81BD', '#F79646']);

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }

    constructor(options?: AgChartThemeOptions) {
        super(options);
    }
}
