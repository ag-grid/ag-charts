import {
    DEFAULT_ANNOTATION_HANDLE_FILL,
    DEFAULT_ANNOTATION_STATISTICS_COLOR,
    DEFAULT_ANNOTATION_STATISTICS_DIVIDER_STROKE,
    DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL,
    DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE,
    DEFAULT_ANNOTATION_STATISTICS_FILL,
    DEFAULT_ANNOTATION_STATISTICS_STROKE,
    DEFAULT_CAPTION_ALIGNMENT,
    DEFAULT_CAPTION_LAYOUT_STYLE,
    DEFAULT_FIBONACCI_STROKES,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    DEFAULT_POLAR_SERIES_STROKE,
    DEFAULT_SHADOW_COLOUR,
    DEFAULT_SPARKLINE_CROSSHAIR_STROKE,
    DEFAULT_TEXTBOX_COLOR,
    DEFAULT_TEXTBOX_FILL,
    DEFAULT_TEXTBOX_STROKE,
    DEFAULT_TEXT_ANNOTATION_COLOR,
    DEFAULT_TOOLBAR_POSITION,
    IS_DARK_THEME,
    PALETTE_ALT_DOWN_FILL,
    PALETTE_ALT_DOWN_STROKE,
    PALETTE_ALT_NEUTRAL_FILL,
    PALETTE_ALT_NEUTRAL_STROKE,
    PALETTE_ALT_UP_FILL,
    PALETTE_ALT_UP_STROKE,
    PALETTE_DOWN_FILL,
    PALETTE_DOWN_STROKE,
    PALETTE_NEUTRAL_FILL,
    PALETTE_NEUTRAL_STROKE,
    PALETTE_UP_FILL,
    PALETTE_UP_STROKE,
} from 'ag-charts-core';
import type { Operation } from 'ag-charts-types';

import { themes } from './chart/mapping/themes';
import { ChartTheme } from './chart/themes/chartTheme';
import { OptionsGraph } from './module/optionsGraph';

// Only these imports are used by ag-grid.
// DO NOT ADD EXPORTS UNLESS REQUIRED BY INTEGRATED CHARTS.
export { getChartTheme } from './chart/mapping/themes';
export const themeSymbols = {
    DEFAULT_ANNOTATION_HANDLE_FILL,
    DEFAULT_ANNOTATION_STATISTICS_COLOR,
    DEFAULT_ANNOTATION_STATISTICS_DIVIDER_STROKE,
    DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL,
    DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE,
    DEFAULT_ANNOTATION_STATISTICS_FILL,
    DEFAULT_ANNOTATION_STATISTICS_STROKE,
    DEFAULT_CAPTION_ALIGNMENT,
    DEFAULT_CAPTION_LAYOUT_STYLE,
    DEFAULT_FIBONACCI_STROKES,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    DEFAULT_POLAR_SERIES_STROKE,
    DEFAULT_SHADOW_COLOUR,
    DEFAULT_SPARKLINE_CROSSHAIR_STROKE,
    DEFAULT_TEXTBOX_COLOR,
    DEFAULT_TEXTBOX_FILL,
    DEFAULT_TEXTBOX_STROKE,
    DEFAULT_TEXT_ANNOTATION_COLOR,
    DEFAULT_TOOLBAR_POSITION,
    IS_DARK_THEME,
    PALETTE_ALT_DOWN_FILL,
    PALETTE_ALT_DOWN_STROKE,
    PALETTE_ALT_NEUTRAL_FILL,
    PALETTE_ALT_NEUTRAL_STROKE,
    PALETTE_ALT_UP_FILL,
    PALETTE_ALT_UP_STROKE,
    PALETTE_DOWN_FILL,
    PALETTE_DOWN_STROKE,
    PALETTE_NEUTRAL_FILL,
    PALETTE_NEUTRAL_STROKE,
    PALETTE_UP_FILL,
    PALETTE_UP_STROKE,
} satisfies Record<string, symbol | boolean | string>;
export const themeNames = Object.keys(themes);

// TODO remove once ag-grid codebase has been updated
export { ChartTheme } from './chart/themes/chartTheme';
export { themes } from './chart/mapping/themes';
export * from 'ag-charts-core';

export function resolveOperation(operation: Operation): any {
    // Use the default theme params and palette, ignoring the grid's chosen theme
    const params = ChartTheme.getDefaultPublicParameters();
    const palette = ChartTheme.getDefaultColors();

    // Create a graph with a stub line series with which to resolve the operation
    const graph = new OptionsGraph({ line: { operation } }, { series: [{ type: 'line' }] }, params, palette);
    const resolved = graph.resolve();

    return resolved.operation;
}
