import type { AgPolarChartOptions } from 'ag-charts-community';
import { AngleCategoryAxis } from '../polar-axes/angle-category/angleCategoryAxis';
import { RadiusNumberAxis } from '../polar-axes/radius-number/radiusNumberAxis';

export const POLAR_DEFAULTS: AgPolarChartOptions = {
    axes: [
        {
            type: AngleCategoryAxis.type,
        },
        {
            type: RadiusNumberAxis.type,
        },
    ],
};
