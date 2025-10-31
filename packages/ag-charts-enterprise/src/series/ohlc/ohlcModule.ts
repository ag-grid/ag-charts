import { type AgOhlcSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

import { OhlcSeries } from './ohlcSeries';
import { ohlcSeriesOptionsDef } from './ohlcSeriesOptionsDef';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
    multiSeriesHighlightStyle,
} = _ModuleSupport;

const themeTemplate: ExtensibleTheme<'ohlc'> = {
    animation: { enabled: false },
    series: {
        item: {
            up: {
                stroke: {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $palette: 'stroke' },
                        { $palette: 'up.stroke' },
                    ],
                },
            },
            down: {
                stroke: {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $palette: 'stroke' },
                        { $palette: 'down.stroke' },
                    ],
                },
            },
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
        },
        highlight: multiSeriesHighlightStyle(false),
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

    options: ohlcSeriesOptionsDef,
    defaultAxes: [
        { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        { type: CARTESIAN_AXIS_TYPE.ORDINAL_TIME, position: CARTESIAN_POSITION.BOTTOM },
    ],
    themeTemplate,

    create: (ctx: _ModuleSupport.ModuleContext) => new OhlcSeries(ctx),
};
