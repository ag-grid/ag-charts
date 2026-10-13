import { VERSION } from 'ag-charts-community';
import {
    type OptionsDefs,
    type PresetModuleDefinition,
    boolean,
    defined,
    positiveNumber,
    typeUnion,
    undocumentedDefs,
    without,
} from 'ag-charts-core';
import type { AgBaseGaugePresetOptions, AgGaugeOptions, AgSeriesTooltip } from 'ag-charts-types';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { gaugeTooltipOptionsDef } from '../../series/gauge-util/gaugeOptionsDefs';
import { linearGaugeSeriesOptionsDef } from '../../series/linear-gauge/linearGaugeSeriesOptionsDef';
import { radialGaugeSeriesOptionsDef } from '../../series/radial-gauge/radialGaugeSeriesOptionsDef';
import { GAUGE_FAST_UPDATE_KEYS, createGauge, gaugeFastUpdate } from './gaugePreset';

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
    tooltip: gaugeTooltipOptionsDef,
    ...undocumentedDefs({
        overrideDevicePixelRatio: positiveNumber,
        foreground: defined,
        withinStudio: boolean,
    }),
};

export const GaugePresetModule: PresetModuleDefinition<AgGaugeOptions> = {
    type: 'preset',
    name: 'gauge-preset',
    apiName: 'AgCharts.createGauge',
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
    fastUpdateKeys: GAUGE_FAST_UPDATE_KEYS,
    processFastUpdate: gaugeFastUpdate,
};
