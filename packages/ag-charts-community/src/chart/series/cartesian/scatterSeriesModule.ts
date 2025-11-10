import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgScatterSeriesOptions, ExtensibleTheme } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import {
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    multiSeriesHighlightStyle,
} from '../../themes/util';
import { ScatterSeries } from './scatterSeries';
import { scatterSeriesOptionsDef } from './scatterSeriesOptionsDef';
import { predictCartesianAxis } from './util';

const themeTemplate: ExtensibleTheme<'scatter'> = {
    series: {
        shape: 'circle',
        size: 7,
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
        fillOpacity: 0.8,
        maxRenderedItems: 10_000,
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
        errorBar: {
            cap: {
                lengthRatio: 1,
            },
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
            position: {
                anchorTo: { $path: ['/tooltip/position/anchorTo', 'node'] },
            },
        },
        highlight: multiSeriesHighlightStyle(),
    },
};

export const ScatterSeriesModule: SeriesModuleDefinition<AgScatterSeriesOptions> = {
    type: 'series',
    name: 'scatter',
    chartType: 'cartesian',
    version: VERSION,

    options: scatterSeriesOptionsDef,
    predictAxis: predictCartesianAxis,
    defaultAxes: {
        x: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.BOTTOM,
        },
        y: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
    },
    themeTemplate,

    create: (ctx: ModuleContext) => new ScatterSeries(ctx),
};
