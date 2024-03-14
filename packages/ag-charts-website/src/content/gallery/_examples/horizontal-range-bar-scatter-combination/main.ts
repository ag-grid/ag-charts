import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
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
            cornerRadius: 2,
        },
        {
            type: 'bubble',
            yKey: 'smartphone',
            xKey: 'profitMargin',
            xName: 'Profil Margin',
            yName: 'Profit Margin %',
            sizeKey: 'profitMargin',
            labelKey: 'profitMargin',
            label: {
                formatter: ({ value }) => `${Number(value).toFixed(0)}%`,
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            keys: ['smartphone'],
            groupPaddingInner: 0,
            paddingInner: 0.9,
            paddingOuter: 0.8,
        },
        {
            type: 'number',
            position: 'top',
            keys: ['profitMargin'],
            label: {
                formatter: ({ value }) => `${value}%`,
            },
            crosshair: {
                label: {
                    renderer: ({ value }) =>
                        `<div style="padding: 0 7px; border-radius: 2px; line-height: 1.7em; background-color: rgb(71,71,71); color: rgb(255, 255, 255);">${Math.round(value)}%</div>`,
                },
            },
        },
        {
            type: 'number',
            position: 'bottom',
            keys: ['lowRetail', 'highRetail', 'lowCost', 'highCost'],
            label: {
                formatter: ({ value }) =>
                    `${Number(value).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                    })}`,
            },
            crosshair: {
                label: {
                    renderer: ({ value }) =>
                        `<div style="padding: 0 7px; border-radius: 2px; line-height: 1.7em; background-color: rgb(71,71,71); color: rgb(255, 255, 255);">${Number(
                            value
                        ).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                        })}</div>`,
                },
            },
        },
    ],
};

AgCharts.create(options);
