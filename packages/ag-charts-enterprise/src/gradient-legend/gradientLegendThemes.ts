import { _Theme } from 'ag-charts-community';
import type { AgChartLegendPosition } from 'ag-charts-community';

const BOTTOM: AgChartLegendPosition = 'bottom';

export const GRADIENT_LEGEND_THEME = {
    position: BOTTOM,
    spacing: 20,
    stop: {
        padding: 8,
        label: {
            color: 'rgb(70, 70, 70)',
            fontStyle: undefined,
            fontWeight: undefined,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            formatter: undefined,
        },
    },
    gradient: {
        preferredLength: 100,
        thickness: 16,
    },
    reverseOrder: false,
};
