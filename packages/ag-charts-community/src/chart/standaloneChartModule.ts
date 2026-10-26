import {
    type ChartModuleDefinition,
    type WithoutModuleOwnedOptions,
    commonChartOptionsDefs,
    commonChartThemeTemplate,
    standaloneChartOptionsDefs,
} from 'ag-charts-core';
import type { AgStandaloneChartOptions } from 'ag-charts-types';

import { communityModule } from '../module/moduleIdentity';
import type { ChartOptions } from '../module/optionsModule';
import { VERSION } from '../version';
import type { TransferableResources } from './chart';
import { StandaloneChart } from './standaloneChart';

export const StandaloneChartModule: ChartModuleDefinition<WithoutModuleOwnedOptions<AgStandaloneChartOptions>> =
    /* #__PURE__ */ communityModule({
        type: 'chart',
        name: 'standalone',
        version: VERSION,

        options: standaloneChartOptionsDefs,

        themeOptions: commonChartOptionsDefs,

        themeTemplate: commonChartThemeTemplate,

        create(options: ChartOptions, resources?: TransferableResources) {
            return new StandaloneChart(options, resources);
        },
    });
