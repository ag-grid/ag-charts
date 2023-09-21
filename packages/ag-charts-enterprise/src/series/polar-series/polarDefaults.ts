import type { AgPolarChartOptions } from 'ag-charts-community';
import { AngleCategoryAxis } from '../../axes/angle-category/angleCategoryAxis';
import { RadiusNumberAxis } from '../../axes/radius-number/radiusNumberAxis';

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
