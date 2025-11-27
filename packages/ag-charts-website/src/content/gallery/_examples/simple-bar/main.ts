import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AnimationModule, BandHighlightModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BandHighlightModule,
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: 'ag-default',
    title: {
        text: 'Total Visitors to Museums and Galleries',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
        fontStyle: 'italic',
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'visitors',
            cornerRadius: 4,
            strokeWidth: 1,
            label: {
                enabled: true,
                placement: 'inside-center',
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Year',
            },
            label: {
                autoRotate: false,
            },
            bandHighlight: {
                enabled: true,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total Visitors (Millions)',
            },
            gridLine: {
                style: [
                    {
                        lineDash: [2, 3],
                        strokeWidth: 1,
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    },
    formatter: {
        y(params) {
            const value = params.value as number;
            const millions = value / 1_000_000;
            const accuracy = ['series-label', 'axis-label'].includes(params.source) ? 0 : 1;
            return `${millions.toFixed(accuracy)}M`;
        },
    },
    animation: {
        enabled: true,
        duration: 800,
    },
};

AgCharts.create(options);
