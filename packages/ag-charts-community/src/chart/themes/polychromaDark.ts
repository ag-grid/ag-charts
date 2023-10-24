import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';
import {
    DEFAULT_HEATMAP_SERIES_COLOUR_RANGE,
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const POLYCHROMA_DARK_FILLS = {
    BLUE: '#436ff4',
    PURPLE: '#9a7bff',
    MAGENTA: '#d165d2',
    PINK: '#f0598b',
    RED: '#f47348',
    ORANGE: '#f2a602',
    YELLOW: '#e9e201',
    GREEN: '#21b448',
    CYAN: '#00b9a2',
    MODERATE_BLUE: '#00aee4',
};

const POLYCHROMA_DARK_STROKES = {
    BLUE: '#6698ff',
    PURPLE: '#c0a3ff',
    MAGENTA: '#fc8dfc',
    PINK: '#ff82b1',
    RED: '#ff9b70',
    ORANGE: '#ffcf4e',
    YELLOW: '#ffff58',
    GREEN: '#58dd70',
    CYAN: '#51e2c9',
    MODERATE_BLUE: '#4fd7ff',
};

const POLYCHROMA_DARK_FILL_GRAY = '#bbbbbb';
const POLYCHROMA_DARK_STROKE_GRAY = '#eeeeee';

const palette: AgChartThemePalette = {
    fills: Array.from(Object.values(POLYCHROMA_DARK_FILLS)),
    strokes: Array.from(Object.values(POLYCHROMA_DARK_STROKES)),
};

export class PolychromaDark extends DarkTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: POLYCHROMA_DARK_FILLS.BLUE,
            stroke: POLYCHROMA_DARK_STROKES.BLUE,
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: POLYCHROMA_DARK_FILLS.RED,
            stroke: POLYCHROMA_DARK_STROKES.RED,
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: POLYCHROMA_DARK_FILL_GRAY,
            stroke: POLYCHROMA_DARK_STROKE_GRAY,
        };
    }

    override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            PolychromaDark.getWaterfallSeriesDefaultPositiveColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            PolychromaDark.getWaterfallSeriesDefaultNegativeColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            PolychromaDark.getWaterfallSeriesDefaultTotalColors()
        );

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            PolychromaDark.getWaterfallSeriesDefaultTotalColors().stroke
        );
        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, [
            POLYCHROMA_DARK_FILLS.BLUE,
            POLYCHROMA_DARK_FILLS.RED,
        ]);

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
