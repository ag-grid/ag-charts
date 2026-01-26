import {
    AgActiveChangeEvent,
    AgChartOptions,
    AgCharts,
    AllEnterpriseModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Energy Production by Source & Country',
    },
    subtitle: {
        text: 'Energy Production (TWh)',
    },
    data: getData(),
    legend: { position: 'left' },
    axes: {
        x: {
            type: 'grouped-category',
            depthOptions: [{ label: { rotation: 0 } }, { label: { fontWeight: 'bold' } }],
            gridLine: {
                style: [
                    { fill: '#eeeeee', stroke: '#cccccc' },
                    { fill: '#eeeeee' },
                    { fill: '#eeeeee' },
                    { stroke: '#cccccc' },
                    {},
                    {},
                ],
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'coal',
            yName: 'Coal',
            fill: '#5b5b5b',
            stackGroup: 'stack',
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'gas',
            yName: 'Natural Gas',
            fill: '#f2a541',
            stackGroup: 'stack',
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'renewables',
            legendItemName: 'Renewables',
            fill: '#4caf50',
            stackGroup: 'stack',
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'nuclear',
            legendItemName: 'Nuclear',
            fill: '#6f7bd9',
            stackGroup: 'stack',
        },
    ],
    listeners: {
        activeChange: (ev: AgActiveChangeEvent<unknown>) => {
            if (ev.activeItem === undefined) {
                console.log(`[inactive], event:`, ev);
            } else {
                const { type: t, seriesId: s, itemId: i } = ev.activeItem;
                console.log(`[${t}], seriesId: ${s}, itemId: ${i}, event:`, ev);
            }
        },
    },
};

AgCharts.create(options);
