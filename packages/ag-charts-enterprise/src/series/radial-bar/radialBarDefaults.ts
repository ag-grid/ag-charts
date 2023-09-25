import type { AgPolarChartOptions } from 'ag-charts-community';
import { AngleNumberAxis } from '../../axes/angle-number/angleNumberAxis';
import { RadiusCategoryAxis } from '../../axes/radius-category/radiusCategoryAxis';

export const RADIAL_BAR_DEFAULTS: AgPolarChartOptions = {
    axes: [
        {
            type: AngleNumberAxis.type,
        },
        {
            type: RadiusCategoryAxis.type,
            innerRadiusRatio: 0.2,
            groupPaddingInner: 0.2,
            paddingInner: 0.2,
            paddingOuter: 0.1,
        },
    ],
};
