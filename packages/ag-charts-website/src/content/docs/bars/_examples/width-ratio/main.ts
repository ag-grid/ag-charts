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
    },
    subtitle: {
        text: 'Monthly temperature ranges (2020) showing seasonal variations across regions',
    },
    footnote: {
        text: 'Data: World Meteorological Organization. Ranges show typical monthly lows and highs.',
        fontStyle: 'italic',
    },
    series: [
        {
            data: data.World,
            type: 'range-bar',
            xKey: 'month',
            yName: 'World',
            yLowKey: 'lowTemperature',
            yHighKey: 'highTemperature',
            yLowName: 'Min Temp',
            yHighName: 'Max Temp',
            cornerRadius: 5,
            fill: 'transparent',
            strokeWidth: 2,
            strokeOpacity: 0.6,
            highlight: { enabled: false },
        },
        {
            data: data.Australia,
            type: 'range-bar',
            xKey: 'month',
            yName: 'Australia',
            grouped: false,
            widthRatio: 0.4,
            yLowKey: 'lowTemperature',
            yHighKey: 'highTemperature',
            yLowName: 'Min Temp',
            yHighName: 'Max Temp',
            cornerRadius: 5,
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
    (options.series![1] as any).widthRatio = value;
    chart.update(options);
    document.getElementById('widthRatioSliderValue')!.innerHTML = String(value);
}
