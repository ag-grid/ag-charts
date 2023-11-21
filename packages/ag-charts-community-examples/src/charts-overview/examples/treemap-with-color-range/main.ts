import type { AgChartOptions, AgTreemapSeriesTooltipRendererParams } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            secondaryLabelKey: 'change',
            sizeName: 'Valuation',
            sizeKey: 'valuation',
            colorName: 'Change',
            colorKey: 'change',
            group: {
                label: {
                    formatter({ value }) {
                        return value.toUpperCase();
                    },
                },
            },
            tile: {
                label: {
                    color: '#34495e',
                    overflowStrategy: 'hide',
                },
                secondaryLabel: {
                    color: '#34495e',
                    overflowStrategy: 'hide',
                    formatter(params) {
                        return params.value.toFixed(2) + '%';
                    },
                },
                strokeWidth: 0,
                gap: 1,
            },
            highlightStyle: {
                tile: {
                    label: {
                        color: '#34495e',
                    },
                    secondaryLabel: {
                        color: '#34495e',
                    },
                },
            },
        },
    ],
    title: {
        text: 'S&P 500 index stocks categorized by sectors and industries.',
    },
    subtitle: {
        text: 'Area represents market cap. Color represents change from the day before.',
    },
};

function tooltipRenderer(params: AgTreemapSeriesTooltipRendererParams<any>) {
    return {
        content: `<b>Change</b>: ${params.datum[params.colorKey!].toFixed(2)}%`,
    };
}

AgCharts.create(options);
