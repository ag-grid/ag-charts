import { VERSION } from 'ag-charts-community';
import {
    type OptionsDefs,
    type PresetModuleDefinition,
    array,
    boolean,
    defined,
    positiveNumber,
    positiveNumberNonZero,
    required,
    string,
    undocumentedDefs,
} from 'ag-charts-core';
import type { AgBaseFinancialPresetOptions, AgVolumeProfileChartPreset } from 'ag-charts-types';

import { AxisInsetValueModule } from '../../features/axis-inset-value/axisInsetValueModule';
import { groupVolumeProfile, volumeProfileTotalSegmentOptionsDef } from './volumeProfile';
import { volumeProfileChart } from './volumeProfilePreset';

const volumeProfileChartOptionsDef: OptionsDefs<AgVolumeProfileChartPreset & AgBaseFinancialPresetOptions> = {
    priceKey: string,
    upKey: required(string),
    downKey: required(string),
    tickSize: positiveNumberNonZero,
    totalSegment: volumeProfileTotalSegmentOptionsDef,
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
    dataSource: defined,
    formatter: defined,
    enableRtl: boolean,
    ...undocumentedDefs({
        overrideDevicePixelRatio: positiveNumber,
        foreground: defined,
    }),
};

export const VolumeProfilePresetModule: PresetModuleDefinition<
    AgVolumeProfileChartPreset & AgBaseFinancialPresetOptions
> = {
    type: 'preset',
    name: 'volume-profile',
    apiName: 'AgCharts.createVolumeProfileChart',
    enterprise: true,
    version: VERSION,
    dependencies: [AxisInsetValueModule],

    options: volumeProfileChartOptionsDef,

    create: volumeProfileChart,
    transformSeriesData: (data, opts) => groupVolumeProfile(data, opts, opts.tickSize),

    baseTheme: 'ag-financial',
    themeTemplate: {
        common: {
            padding: { $applyPadding: 20 },
            // @ts-expect-error undocumented option
            title: { layoutStyle: 'block', textAlign: 'center' },
            // @ts-expect-error undocumented option
            subtitle: { layoutStyle: 'block', textAlign: 'center' },
            // @ts-expect-error undocumented option
            footnote: { layoutStyle: 'block', textAlign: 'center' },
        },
    },
};
