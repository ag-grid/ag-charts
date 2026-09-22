import { type AgRangesOptions, VERSION } from 'ag-charts-community';
import { type PluginModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { Ranges } from './ranges';
import { rangesOptionsDefs } from './rangesOptionsDefs';
import { rangesTheme } from './rangesTheme';

export const RangesModule: PluginModuleDefinition<AgRangesOptions> = {
    type: 'plugin',
    name: 'ranges',
    chartTypes: ['cartesian'],
    dependencies: [BackgroundRegionsModule],
    enterprise: true,
    version: VERSION,
    options: rangesOptionsDefs,
    themeTemplate: rangesTheme,
    create: (ctx) => new Ranges(ctx),
};
