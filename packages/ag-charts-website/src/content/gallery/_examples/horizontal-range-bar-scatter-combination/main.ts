import { BubbleSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { RangeBarSeriesModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, CategoryAxisModule, NumberAxisModule, RangeBarSeriesModule]);
const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 0,
});

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Smartphone Production Cost Vs Retail Price',
    },
    subtitle: {
        text: 'Production cost range vs retail price range of top-selling phone brands on the market in 2023',
        spacing: 30,
    },
    footnote: {
        text: 'Costs include essential components like core processors, display, memory, and camera module but exclude marketing, research, distribution, staff, accessories, packaging, and software.',
        spacing: 30,
    },
    series: [
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'smartphone',
            xName: 'Smartphone',
            yLowKey: 'lowCost',
            yHighKey: 'highCost',
            yLowName: 'Lowest Cost',
            yHighName: 'Highest Cost',
            yName: 'Production Cost Range',
            xKeyAxis: 'xSecondary',
            cornerRadius: 2,
        },
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'smartphone',
            xName: 'Smartphone',
            yLowKey: 'lowRetail',
            yHighKey: 'highRetail',
            yLowName: 'Lowest Price',
            yHighName: 'Highest Price',
            yName: 'Retail Price Range',
            xKeyAxis: 'xSecondary',
            cornerRadius: 2,
        },
        {
            type: 'bubble',
            yKey: 'smartphone',
            xKey: 'profitMargin',
            xName: 'Profit Margin',
            yName: 'Profit Margin %',
            sizeKey: 'profitMargin',
            labelKey: 'profitMargin',
            tooltip: {
                renderer({ datum, xName }) {
                    return {
                        title: datum.smartphone,
                        data: [
                            {
                                label: xName!,
                                value: numberFormatter.format(datum.profitMargin / 100),
                            },
                        ],
                    };
                },
            },
            label: {
                formatter: ({ value }) => `${Number(value).toFixed(0)}%`,
            },
        },
    ],
    axes: {
        y: {
            type: 'category',
            position: 'left',
            groupPaddingInner: 0,
            paddingInner: 0.9,
            paddingOuter: 0.8,
        },
        x: {
            type: 'number',
            position: 'top',
            label: {
                formatter: ({ value }) => `${Math.round(value)}%`,
            },
        },
        xSecondary: {
            type: 'number',
            position: 'bottom',
            label: {
                formatter: ({ value }) =>
                    `${Number(value).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                    })}`,
            },
        },
    },
    seriesArea: { padding: { right: 10 } },
};

AgCharts.create(options);
