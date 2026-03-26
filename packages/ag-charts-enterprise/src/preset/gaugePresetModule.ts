import { VERSION } from 'ag-charts-community';
import {
    type OptionsDefs,
    type PresetModuleDefinition,
    boolean,
    commonChartOptionsDefs,
    defined,
    linearGaugeSeriesOptionsDef,
    positiveNumber,
    radialGaugeSeriesOptionsDef,
    tooltipOptionsDefs,
    typeUnion,
    undocumented,
    without,
} from 'ag-charts-core';
import type { AgBaseGaugePresetOptions, AgChartTooltipOptions, AgGaugeOptions, AgSeriesTooltip } from 'ag-charts-types';

import { StandaloneChartModule } from '../charts/standaloneChartModule';
import { createGauge } from './gaugePreset';

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
// @ts-expect-error undocumented option
commonGaugeOptions.foreground = undocumented(defined);
// @ts-expect-error undocumented option
commonGaugeOptions.withinStudio = undocumented(boolean);

export const GaugePresetModule: PresetModuleDefinition<AgGaugeOptions> = {
    type: 'preset',
    name: 'gauge-preset',
    enterprise: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

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

    create: createGauge,
};
