import {
    type OptionsDefs,
    type PresetModuleDefinition,
    array,
    boolean,
    defined,
    positiveNumber,
    string,
    typeUnion,
    undocumented,
    union,
    without,
} from 'ag-charts-core';
import type {
    AgBaseFinancialPresetOptions,
    AgBaseGaugePresetOptions,
    AgChartTooltipOptions,
    AgGaugeOptions,
    AgPriceVolumePreset,
    AgSeriesTooltip,
} from 'ag-charts-types';
import { VERSION, _ModuleSupport } from 'ag-charts-community';

import { gauge } from './gauge';
import { priceVolume } from './priceVolumePreset';

const { commonChartOptionsDefs, tooltipOptionsDefs, linearGaugeSeriesOptionsDef, radialGaugeSeriesOptionsDef } =
    _ModuleSupport;

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

export const PriceVolumePresetModule: PresetModuleDefinition<AgPriceVolumePreset & AgBaseFinancialPresetOptions> = {
    type: 'preset',
    name: 'price-volume',
    enterprise: true,
    placeholder: true,
    version: VERSION,

    options: priceVolumeOptionsDef,

    create: priceVolume,
};

export const GaugePresetModule: PresetModuleDefinition<AgGaugeOptions> = {
    type: 'preset',
    name: 'gauge-preset',
    enterprise: true,
    placeholder: true,
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
