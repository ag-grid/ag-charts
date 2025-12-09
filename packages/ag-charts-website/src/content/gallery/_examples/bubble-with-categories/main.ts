import {
    AgChartOptions,
    AgCharts,
    BubbleSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { days, getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, CategoryAxisModule]);
const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Punch Card of GitHub',
    },
    subtitle: {
        text: 'Time Distribution of Commits',
    },
    series: days.map((day) => ({
        data: data.filter((d) => d.day === day),
        type: 'bubble',
        title: day,
        xKey: 'hour',
        xName: 'Time',
        yKey: 'day',
        yName: 'Day',
        sizeKey: 'size',
        sizeName: 'Commits',
        strokeWidth: 0,
        size: 0,
        maxSize: 40,
    })),
    axes: {
        x: {
            type: 'category',
            label: {
                autoRotate: false,
            },
            gridLine: {
                enabled: true,
            },
            line: {
                enabled: false,
            },
        },
        y: {
            type: 'category',
            line: {
                enabled: false,
            },
        },
    },
    seriesArea: {
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 30,
        },
    },
};

AgCharts.create(options);
