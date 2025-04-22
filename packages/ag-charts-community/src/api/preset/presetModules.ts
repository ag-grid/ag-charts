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
    required,
    string,
    strokeOptionsDef,
    typeUnion,
    union,
} from 'ag-charts-core';
import type {
    AgBaseFinancialPresetOptions,
    AgBaseGaugePresetOptions,
    AgChartTooltipOptions,
    AgLinearGaugeOptions,
    AgPriceVolumePreset,
    AgRadialGaugeOptions,
    AgSeriesTooltip,
    AgSparklineAxisOptions,
    AgSparklineBaseAxisOptions,
    AgSparklineOptions,
} from 'ag-charts-types';

import {
    commonChartOptionsDefs,
    commonSeriesOptionsDefs,
    rangeValidator,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../chart/commonOptionsDefs';
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
    data: defined,
};

const commonGaugeOptions: OptionsDefs<AgBaseGaugePresetOptions & { tooltip?: AgSeriesTooltip<any> }> = {
    // Valid pass-through options
    theme: defined,
    container: defined,
    animation: defined,
    background: defined,
    contextMenu: defined,
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

const radialGaugePresetOptionsDef: OptionsDefs<AgRadialGaugeOptions> = {
    ...radialGaugeSeriesOptionsDef,
    ...commonGaugeOptions,
};

const linearGaugePresetOptionsDef: OptionsDefs<AgLinearGaugeOptions> = {
    ...linearGaugeSeriesOptionsDef,
    ...commonGaugeOptions,
};

const commonSparklineAxisOptionsDef: OptionsDefs<AgSparklineBaseAxisOptions> = {
    visible: boolean,
    reverse: boolean,
    stroke: color,
    strokeWidth: positiveNumber,
};

const sparklineOptionsDef: OptionsDefs<AgSparklineOptions> = {
    axis: typeUnion<AgSparklineAxisOptions>({
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
    }),
    crosshair: {
        enabled: boolean,
        snap: boolean,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    highlightStyle: commonSeriesOptionsDefs.highlightStyle,
    label: seriesLabelOptionsDefs,
    id: string,
    context: defined,
    min: and(number, lessThan('max')),
    max: and(number, greaterThan('min')),
    nodeClickRange: rangeValidator,
    normalizedTo: number,
    type: union('bar', 'line', 'area'),
    visible: boolean,
    xKey: required(string),
    yKey: required(string),
    xName: string,
    yName: string,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,

    tooltip: defined,
    cursor: defined,

    // Valid pass-through options
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
};

export const PriceVolumePresetModule: PresetModuleDefinition<AgPriceVolumePreset & AgBaseFinancialPresetOptions> = {
    type: 'preset',
    name: 'price-volume',
    enterprise: true,

    options: priceVolumeOptionsDef,

    create: priceVolume,
};

export const RadialGaugePresetModule: PresetModuleDefinition<AgRadialGaugeOptions> = {
    type: 'preset',
    name: 'radial-gauge-preset',
    enterprise: true,

    options: radialGaugePresetOptionsDef,

    create: gauge,
};

export const LinearGaugePresetModule: PresetModuleDefinition<AgLinearGaugeOptions> = {
    type: 'preset',
    name: 'linear-gauge-preset',
    enterprise: true,

    options: linearGaugePresetOptionsDef,

    create: gauge,
};

export const SparklinePresetModule: PresetModuleDefinition<AgSparklineOptions> = {
    type: 'preset',
    name: 'sparkline',

    options: sparklineOptionsDef,

    create: sparkline,
    processData: sparklineDataPreset,
};
