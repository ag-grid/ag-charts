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
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const DEFAULT_DARK_FILLS = {
    BLUE: '#4F81BD',
    ORANGE: '#F79646',
    GREEN: '#468A51',
    CYAN: '#4BACC6',
    YELLOW: '#CDBC21',
    VIOLET: '#8460AF',
    GRAY: '#7B7B7B',
    MAGENTA: '#A55492',
    BROWN: '#73572E',
    RED: '#D3504D',
};

const DEFAULT_DARK_STROKES = {
    BLUE: '#74a8e6',
    ORANGE: '#ffbe70',
    GREEN: '#6cb176',
    CYAN: '#75d4ef',
    YELLOW: '#f6e559',
    VIOLET: '#aa86d8',
    GRAY: '#a1a1a1',
    MAGENTA: '#ce7ab9',
    BROWN: '#997b52',
    RED: '#ff7872',
};

const palette: AgChartThemePalette = {
    fills: Array.from(Object.values(DEFAULT_DARK_FILLS)),
    strokes: Array.from(Object.values(DEFAULT_DARK_STROKES)),
};

export class DarkTheme extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: DEFAULT_DARK_FILLS.BLUE,
            stroke: DEFAULT_DARK_STROKES.BLUE,
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: DEFAULT_DARK_FILLS.ORANGE,
            stroke: DEFAULT_DARK_STROKES.ORANGE,
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: DEFAULT_DARK_FILLS.GRAY,
            stroke: DEFAULT_DARK_STROKES.GRAY,
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

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            DarkTheme.getWaterfallSeriesDefaultTotalColors().stroke
        );
        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, [
            DEFAULT_DARK_FILLS.BLUE,
            DEFAULT_DARK_FILLS.ORANGE,
        ]);

        result.properties.set(DEFAULT_LABEL_COLOUR, 'white');
        result.properties.set(DEFAULT_MUTED_LABEL_COLOUR, '#7D91A0');
        result.properties.set(DEFAULT_AXIS_GRID_COLOUR, '#545A6E');
        result.properties.set(DEFAULT_BACKGROUND_COLOUR, '#15181c');
        result.properties.set(DEFAULT_TREEMAP_TILE_BORDER_COLOUR, 'white');
        result.properties.set(DEFAULT_INSIDE_SERIES_LABEL_COLOUR, '#15181c');

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }

    constructor(options?: AgChartThemeOptions) {
        super(options);
    }
}
