import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const MATERIAL_LIGHT_FILLS = {
    BLUE: '#2196F3',
    ORANGE: '#FF9800',
    GREEN: '#4CAF50',
    CYAN: '#00BCD4',
    YELLOW: '#FFEB3B',
    VIOLET: '#7E57C2',
    GRAY: '#9E9E9E',
    MAGENTA: '#F06292',
    BROWN: '#795548',
    RED: '#F44336',
};

const MATERIAL_LIGHT_STROKES = {
    BLUE: '#1565C0',
    ORANGE: '#E65100',
    GREEN: '#2E7D32',
    CYAN: '#00838F',
    YELLOW: '#F9A825',
    VIOLET: '#4527A0',
    GRAY: '#616161',
    MAGENTA: '#C2185B',
    BROWN: '#4E342E',
    RED: '#B71C1C',
};

const palette: AgChartThemePalette = {
    fills: Array.from(Object.values(MATERIAL_LIGHT_FILLS)),
    strokes: Array.from(Object.values(MATERIAL_LIGHT_STROKES)),
};

export class MaterialLight extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: MATERIAL_LIGHT_FILLS.BLUE,
            stroke: MATERIAL_LIGHT_STROKES.BLUE,
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: MATERIAL_LIGHT_FILLS.RED,
            stroke: MATERIAL_LIGHT_STROKES.RED,
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: MATERIAL_LIGHT_FILLS.GRAY,
            stroke: MATERIAL_LIGHT_STROKES.GRAY,
        };
    }

    override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            MaterialLight.getWaterfallSeriesDefaultPositiveColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            MaterialLight.getWaterfallSeriesDefaultNegativeColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            MaterialLight.getWaterfallSeriesDefaultTotalColors()
        );

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            MaterialLight.getWaterfallSeriesDefaultTotalColors().stroke
        );
        result.properties.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            MATERIAL_LIGHT_FILLS.BLUE,
            MATERIAL_LIGHT_FILLS.RED,
        ]);

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
