import type { ChartModuleDefinition } from 'ag-charts-core';
import type { AgPolarChartOptions } from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import type { TransferableResources } from './chart';
import { type OmitChartAddons, polarChartOptionsDefs } from './chartOptionsDefs';
import { isAgPolarChartOptions } from './mapping/types';
import { PolarChart } from './polarChart';

export const PolarChartModule: ChartModuleDefinition<OmitChartAddons<AgPolarChartOptions>> = {
    type: 'chart',
    name: 'polar',

    options: polarChartOptionsDefs,

    detect: isAgPolarChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new PolarChart(options, resources);
    },
};
