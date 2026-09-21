import {
    type AgOhlcSeriesItemOptions,
    type AgOhlcSeriesOptions,
    CartesianChartModule,
    VERSION,
    type WithThemeParams,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    ChartAxisDirection,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SERIES_INTERACTION_THEME_DEFAULTS,
    SERIES_SELECTION_THEME,
    STROKE_STYLE_THEME_DEFAULTS,
    type SeriesModuleDefinition,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

import { OhlcSeries } from './ohlcSeries';
import { ohlcSeriesOptionsDef } from './ohlcSeriesOptionsDef';

const { predictCartesianFinancialAxis } = _ModuleSupport;

function itemTheme(key: 'up' | 'down'): WithThemeParams<AgOhlcSeriesItemOptions> {
    return {
        stroke: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                { $palette: 'stroke' },
                { $palette: `${key}.stroke` },
            ],
        },
        strokeWidth: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
    };
}

const themeTemplate: ExtensibleSeriesTheme<'ohlc'> = {
    animation: { enabled: false },
    series: {
        ...SERIES_INTERACTION_THEME_DEFAULTS,
        item: {
            up: itemTheme('up'),
            down: itemTheme('down'),
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
            interaction: { enabled: false },
        },
        highlight: { ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                snap: false,
            },
        },
        [CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
            groupPaddingInner: 0,
            crosshair: {
                enabled: true,
            },
        },
    },
};

export const OhlcSeriesModule: SeriesModuleDefinition<AgOhlcSeriesOptions> = {
    type: 'series',
    name: 'ohlc',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: ohlcSeriesOptionsDef,
    matchingKeys: ['xKey', 'lowKey', 'highKey', 'openKey', 'closeKey', 'normalizedTo'],
    predictAxis: predictCartesianFinancialAxis,
    defaultAxes: {
        y: { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        x: { type: CARTESIAN_AXIS_TYPE.ORDINAL_TIME, position: CARTESIAN_POSITION.BOTTOM },
    },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeTemplate,

    create: (ctx) => new OhlcSeries(ctx),
};
