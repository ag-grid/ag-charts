import type { AgChartLegendPosition, AgGradientLegendOptions } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

const BOTTOM: AgChartLegendPosition = 'bottom';

export const GRADIENT_LEGEND_THEME: AgGradientLegendOptions = {
    position: BOTTOM,
    spacing: 20,
    scale: {
        padding: 8,
        label: {
            color: _Theme.DEFAULT_LABEL_COLOUR,
            fontStyle: undefined,
            fontWeight: undefined,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            formatter: undefined,
        },
        interval: {
            minSpacing: 1,
        },
    },
    gradient: {
        preferredLength: 100,
        thickness: 16,
    },
    reverseOrder: false,
};
