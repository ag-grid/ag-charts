import {
    type ChartModuleDefinition,
    type WithoutModuleOwnedOptions,
    commonChartOptionsDefs,
    commonChartThemeTemplate,
    standaloneChartOptionsDefs,
} from 'ag-charts-core';
import type { AgStandaloneChartOptions } from 'ag-charts-types';

import { communityModule } from '../module/moduleIdentity';
import { VERSION } from '../version';
import type { ChartEnv, ChartTypeHost } from './chartTypeEnv';
import { StandaloneChartType } from './standaloneChart';

export const StandaloneChartModule: ChartModuleDefinition<
    WithoutModuleOwnedOptions<AgStandaloneChartOptions>,
    ChartEnv
> = /* #__PURE__ */ communityModule({
    type: 'chart',
    name: 'standalone',
    version: VERSION,

    options: standaloneChartOptionsDefs,

    themeOptions: commonChartOptionsDefs,

    themeTemplate: commonChartThemeTemplate,

    create(host: ChartTypeHost) {
        return new StandaloneChartType(host);
    },
});
