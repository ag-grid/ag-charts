import {
    AgCartesianChartOptions,
    AgCharts,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    RangeBarSeriesModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    RangeBarSeriesModule,
    UnitTimeAxisModule,
]);
const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Australia vs Global Temperature Patterns',
        spacing: 8,
    },
    subtitle: {
        text: 'Monthly temperature ranges (2020) showing seasonal variations across regions',
        spacing: 16,
    },
    footnote: {
        text: 'Data: World Meteorological Organization. Ranges show typical monthly lows and highs.',
        fontStyle: 'italic',
        spacing: 12,
    },
    series: [
        {
            data: data.World,
            type: 'range-bar',
            xKey: 'month',
            xName: 'Month',
            yName: 'World',
            yLowKey: 'lowTemperature',
            yHighKey: 'highTemperature',
            yLowName: 'Min Temp',
            yHighName: 'Max Temp',
            cornerRadius: 3,
        },
        {
            data: data.Australia,
            type: 'range-bar',
            xKey: 'month',
            xName: 'Month',
            yName: 'Australia',
            grouped: false,
            widthRatio: 0.4,
            yLowKey: 'lowTemperature',
            yHighKey: 'highTemperature',
            yLowName: 'Min Temp',
            yHighName: 'Max Temp',
            cornerRadius: 3,
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            label: {
                formatter: ({ value }) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short' });
                },
            },
        },
        y: {
            label: {
                formatter: ({ value }) => `${value}°C`,
            },
        },
    },
};

const chart = AgCharts.create(options);

function updateWidthRatio(event: any) {
    const value = Number(event.target?.value);
    for (const series of options.series ?? []) {
        if (!('widthRatio' in series)) continue;
        series.widthRatio = value;
    }
    chart.update(options);
    document.getElementById('widthRatioSliderValue')!.innerHTML = String(value);
}
