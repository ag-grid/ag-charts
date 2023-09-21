import type { AgPolarChartOptions } from 'ag-charts-community';
import { AngleNumberAxis } from '../../polar-axes/angle-number/angleNumberAxis';
import { RadiusCategoryAxis } from '../../polar-axes/radius-category/radiusCategoryAxis';

export const RADIAL_BAR_DEFAULTS: AgPolarChartOptions = {
    axes: [
        {
            type: AngleNumberAxis.type,
        },
        {
            type: RadiusCategoryAxis.type,
            innerRadiusRatio: 0.5,
            groupPaddingInner: 0,
            paddingInner: 0,
        },
    ],
};
