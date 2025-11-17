import {
    type OptionsDefs,
    type PresetModuleDefinition,
    and,
    boolean,
    color,
    date,
    defined,
    greaterThan,
    lessThan,
    lineDashOptionsDef,
    number,
    or,
    positiveNumber,
    ratio,
    string,
    strokeOptionsDef,
    typeUnion,
    undocumented,
    without,
} from 'ag-charts-core';
import type {
    AgBaseSparklinePresetOptions,
    AgSparklineAxisOptions,
    AgSparklineBaseAxisOptions,
    AgSparklineBaseThemeableOptions,
    AgSparklineDataKeysOptions,
    AgSparklineOptions,
} from 'ag-charts-types';

import { areaSeriesOptionsDef } from '../../chart/series/cartesian/areaSeriesOptionsDef';
import { barSeriesOptionsDef } from '../../chart/series/cartesian/barSeriesOptionsDef';
import { lineSeriesOptionsDef } from '../../chart/series/cartesian/lineSeriesOptionsDef';
import { VERSION } from '../../version';
import { sparkline, sparklineDataPreset } from './sparkline';

const commonSparklineOmit = [
    'showInLegend',
    'showInMiniChart',
    'grouped',
    'stacked',
    'stackGroup',
    'tooltip',
    'listeners',
    'errorBar',
    'xKey',
    'yKey',
    'type',
] as const;

const commonSparklineAxisOptionsDef: OptionsDefs<AgSparklineBaseAxisOptions> = {
    visible: boolean,
    reverse: boolean,
    stroke: color,
    strokeWidth: positiveNumber,
};

const commonSparklineOptionsDef: OptionsDefs<
    AgBaseSparklinePresetOptions & AgSparklineBaseThemeableOptions & AgSparklineDataKeysOptions
> = {
    context: () => true,
    tooltip: defined,
    theme: defined,
    background: defined,
    container: defined,
    width: defined,
    height: defined,
    minWidth: defined,
    minHeight: defined,
    padding: defined,
    listeners: defined,
    locale: defined,
    data: defined,
    styleNonce: string,

    axis: typeUnion<AgSparklineAxisOptions>(
        {
            number: {
                ...commonSparklineAxisOptionsDef,
                min: and(number, lessThan('max')),
                max: and(number, greaterThan('min')),
            },
            category: {
                ...commonSparklineAxisOptionsDef,
                paddingInner: ratio,
                paddingOuter: ratio,
            },
            time: {
                ...commonSparklineAxisOptionsDef,
                min: and(or(number, date), lessThan('max')),
                max: and(or(number, date), greaterThan('min')),
            },
        },
        'axis options',
        'category' // AG-14799 - Contrary to the AgSparklineAxisOptions interface, type is optional and defaults to 'category'.
    ),
    min: and(number, lessThan('max')),
    max: and(number, greaterThan('min')),
    crosshair: {
        enabled: boolean,
        snap: boolean,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    xKey: string,
    yKey: string,
};

// @ts-expect-error undocumented option
commonSparklineOptionsDef.overrideDevicePixelRatio = undocumented(number);

export const SparklinePresetModule: PresetModuleDefinition<AgSparklineOptions> = {
    type: 'preset',
    name: 'sparkline',
    version: VERSION,

    options: typeUnion<AgSparklineOptions>(
        {
            area: {
                ...commonSparklineOptionsDef,
                ...without(areaSeriesOptionsDef, commonSparklineOmit),
            },
            bar: {
                ...commonSparklineOptionsDef,
                ...without(barSeriesOptionsDef, commonSparklineOmit),
            },
            line: {
                ...commonSparklineOptionsDef,
                ...without(lineSeriesOptionsDef, commonSparklineOmit),
            },
        },
        'sparkline options'
    ),

    create: sparkline,
    processData: sparklineDataPreset,
};
