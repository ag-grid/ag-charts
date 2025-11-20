import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { BandHighlightModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([BandHighlightModule, BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Ethnic Diversity of School Pupils',
    },
    footnote: {
        text: 'Source: Department for Education',
    },
    tooltip: {
        mode: 'shared',
    },
    series: [
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'white',
            yName: 'White',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'mixed',
            yName: 'Mixed',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'asian',
            yName: 'Asian',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'black',
            yName: 'Black',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'chinese',
            yName: 'Chinese',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'other',
            yName: 'Other',
            normalizedTo: 100,
            stacked: true,
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            bandHighlight: {
                enabled: true,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                format: '#{.0f}%',
            },
        },
    },
    legend: {
        position: 'bottom',
    },
};

AgCharts.create(options);
