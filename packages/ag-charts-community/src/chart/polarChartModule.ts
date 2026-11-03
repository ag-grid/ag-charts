import {
    type ChartModuleDefinition,
    type WithoutModuleOwnedOptions,
    commonChartOptionsDefs,
    commonChartThemeTemplate,
    polarChartOptionsDefs,
} from 'ag-charts-core';
import type { AgPolarChartOptions } from 'ag-charts-types';

import { communityModule } from '../module/moduleIdentity';
import type { ChartOptions } from '../module/optionsModule';
import { VERSION } from '../version';
import type { TransferableResources } from './chart';
import { PolarChart } from './polarChart';

export const PolarChartModule: ChartModuleDefinition<WithoutModuleOwnedOptions<AgPolarChartOptions>> =
    /* #__PURE__ */ communityModule({
        type: 'chart',
        name: 'polar',
        version: VERSION,

        options: polarChartOptionsDefs,

        themeOptions: commonChartOptionsDefs,

        themeTemplate: commonChartThemeTemplate,

        create(options: ChartOptions, resources?: TransferableResources) {
            return new PolarChart(options, resources);
        },
    });
