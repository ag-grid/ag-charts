import {
    type ChartModuleDefinition,
    type WithoutModuleOwnedOptions,
    commonChartOptionsDefs,
    commonChartThemeTemplate,
    polarChartOptionsDefs,
} from 'ag-charts-core';
import type { AgPolarChartOptions } from 'ag-charts-types';

import { communityModule } from '../module/moduleIdentity';
import { VERSION } from '../version';
import type { ChartTypeHost } from './chartTypeInstance';
import { PolarChartType } from './polarChart';

export const PolarChartModule: ChartModuleDefinition<WithoutModuleOwnedOptions<AgPolarChartOptions>> =
    /* #__PURE__ */ communityModule({
        type: 'chart',
        name: 'polar',
        version: VERSION,

        options: polarChartOptionsDefs,

        themeOptions: commonChartOptionsDefs,

        themeTemplate: commonChartThemeTemplate,

        create(host: ChartTypeHost) {
            return new PolarChartType(host);
        },
    });
