import type { AgCartesianChartOptions } from 'ag-charts-types';

type CartesianAxis = Exclude<AgCartesianChartOptions['axes'], undefined>[0];

export function swapAxisCondition(axes: [CartesianAxis, CartesianAxis], swap: (series: any) => boolean) {
    return (series: any) => {
        if (swap(series)) {
            return [
                { ...axes[0], position: axes[1].position },
                { ...axes[1], position: axes[0].position },
            ];
        } else {
            return axes;
        }
    };
}
