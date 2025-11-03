import {
    type OptionsDefs,
    type PresetModuleDefinition,
    and,
    array,
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
    union,
} from 'ag-charts-core';
import type {
    AgBaseFinancialPresetOptions,
    AgBaseGaugePresetOptions,
    AgBaseSparklinePresetOptions,
    AgChartTooltipOptions,
    AgGaugeOptions,
    AgPriceVolumePreset,
    AgSeriesTooltip,
    AgSparklineAxisOptions,
    AgSparklineBaseAxisOptions,
    AgSparklineBaseThemeableOptions,
    AgSparklineDataKeysOptions,
    AgSparklineOptions,
} from 'ag-charts-types';

import { commonChartOptionsDefs, tooltipOptionsDefs } from '../../chart/commonOptionsDefs';
import { areaSeriesOptionsDef } from '../../chart/series/cartesian/areaSeriesOptionsDef';
import { barSeriesOptionsDef } from '../../chart/series/cartesian/barSeriesOptionsDef';
import { lineSeriesOptionsDef } from '../../chart/series/cartesian/lineSeriesOptionsDef';
import { without } from '../../util/object';
import { VERSION } from '../../version';
import { gauge } from './gauge';
import { linearGaugeSeriesOptionsDef, radialGaugeSeriesOptionsDef } from './gaugeOptionsDefs';
import { priceVolume } from './priceVolumePreset';
import { sparkline, sparklineDataPreset } from './sparkline';

const priceVolumeOptionsDef: OptionsDefs<AgPriceVolumePreset & AgBaseFinancialPresetOptions> = {
    chartType: union('candlestick', 'hollow-candlestick', 'ohlc', 'line', 'step-line', 'hlc', 'high-low'),
    dateKey: string,
    openKey: string,
    highKey: string,
    lowKey: string,
    closeKey: string,
    volumeKey: string,
    navigator: boolean,
    volume: boolean,
    rangeButtons: boolean,
    statusBar: boolean,
    toolbar: boolean,
    zoom: boolean,
    sync: boolean,
    // Valid pass-through options
    theme: defined,
    container: defined,
    width: defined,
    height: defined,
    minWidth: defined,
    minHeight: defined,
    listeners: defined,
    initialState: defined,
    title: defined,
    data: array,
    formatter: defined,
};

const commonGaugeOptions: OptionsDefs<AgBaseGaugePresetOptions & { tooltip?: AgSeriesTooltip<any> }> = {
    // Valid pass-through options
    theme: defined,
    container: defined,
    animation: defined,
    background: defined,
    contextMenu: defined,
    context: () => true,
    listeners: defined,
    locale: defined,
    width: defined,
    height: defined,
    minWidth: defined,
    minHeight: defined,
    title: defined,
    subtitle: defined,
    footnote: defined,
    padding: defined,
    tooltip: {
        ...tooltipOptionsDefs,
        ...(commonChartOptionsDefs.tooltip as OptionsDefs<AgChartTooltipOptions>),
    },
};

// @ts-expect-error undocumented option
commonGaugeOptions.overrideDevicePixelRatio = undocumented(positiveNumber);

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

export const PriceVolumePresetModule: PresetModuleDefinition<AgPriceVolumePreset & AgBaseFinancialPresetOptions> = {
    type: 'preset',
    name: 'price-volume',
    enterprise: true,
    version: VERSION,

    options: priceVolumeOptionsDef,

    create: priceVolume,
};

export const GaugePresetModule: PresetModuleDefinition<AgGaugeOptions> = {
    type: 'preset',
    name: 'gauge-preset',
    enterprise: true,
    version: VERSION,

    options: typeUnion<AgGaugeOptions>(
        {
            'linear-gauge': {
                ...without(linearGaugeSeriesOptionsDef, ['type']),
                ...commonGaugeOptions,
            },
            'radial-gauge': {
                ...without(radialGaugeSeriesOptionsDef, ['type']),
                ...commonGaugeOptions,
            },
        },
        'gauge options'
    ),

    create: gauge,
};

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
