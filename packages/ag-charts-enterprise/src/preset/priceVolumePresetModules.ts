import { VERSION } from 'ag-charts-community';
import {
    type OptionsDefs,
    type PresetModuleDefinition,
    array,
    boolean,
    commonChartOptionsDefs,
    defined,
    positiveNumber,
    string,
    tooltipOptionsDefs,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgBaseFinancialPresetOptions,
    AgBaseGaugePresetOptions,
    AgChartTooltipOptions,
    AgPriceVolumePreset,
    AgSeriesTooltip,
} from 'ag-charts-types';

import { ChartToolbarModule } from '../features/chart-toolbar/chartToolbarModule';
import { StatusBarModule } from '../features/status-bar/statusBarModule';
import { priceVolume } from './priceVolumePreset';

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
    dataIdKey: string,
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
    dependencies: [ChartToolbarModule, StatusBarModule],
    version: VERSION,

    options: priceVolumeOptionsDef,

    create: priceVolume,
};
