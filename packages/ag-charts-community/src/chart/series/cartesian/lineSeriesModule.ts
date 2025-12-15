import type { SeriesModuleDefinition } from 'ag-charts-core';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    ChartAxisDirection,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MARKER_SERIES_HIGHLIGHT_STYLE,
    SAFE_STROKE_FILL_OPERATION,
    SEGMENTATION_DEFAULTS,
} from 'ag-charts-core';
import type { AgLineSeriesOptions, ExtensibleTheme } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { LineSeries } from './lineSeries';
import { lineSeriesOptionsDef } from './lineSeriesOptionsDef';
import { predictCartesianNonPrimitiveAxis } from './util';

const themeTemplate: ExtensibleTheme<'line'> = {
    series: {
        stroke: SAFE_STROKE_FILL_OPERATION,
        strokeWidth: 2,
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
        interpolation: {
            type: 'linear',
        },
        marker: {
            shape: 'circle',
            size: 7,
            strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
            fill: {
                $applySwitch: [
                    { $path: 'type' },
                    { $palette: 'fill' },
                    ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            },
            stroke: { $palette: 'stroke' },
        },
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
            position: {
                anchorTo: { $path: ['/tooltip/position/anchorTo', 'node'] },
            },
        },
        highlight: MARKER_SERIES_HIGHLIGHT_STYLE,
        segmentation: SEGMENTATION_DEFAULTS,
    },
};

export const LineSeriesModule: SeriesModuleDefinition<AgLineSeriesOptions> = {
    type: 'series',
    name: 'line',
    chartType: 'cartesian',
    stackable: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: lineSeriesOptionsDef,
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: {
        y: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
        x: {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: CARTESIAN_POSITION.BOTTOM,
        },
    },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeTemplate,

    create: (ctx: ModuleContext) => new LineSeries(ctx),
};
