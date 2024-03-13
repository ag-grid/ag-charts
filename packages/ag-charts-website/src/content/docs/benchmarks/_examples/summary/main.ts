/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const initialLoadKeys: (keyof ReturnType<typeof getData>[number]['results'])[] = [
    'integrated charts large scale benchmark initial load',
    'large-dataset benchmark initial load',
    'large-scale multi-series benchmark initial load',
    'multi-series benchmark initial load',
];

const seriesToggleKeys: (keyof ReturnType<typeof getData>[number]['results'])[] = [
    'integrated charts large scale benchmark after load 4x legend toggle',
    'large-dataset benchmark after load 1x legend toggle',
    'large-scale multi-series benchmark after load 4x legend toggle',
    'multi-series benchmark after load 10x legend toggle',
];

const seriesHighlightKeys: (keyof ReturnType<typeof getData>[number]['results'])[] = [
    'large-dataset benchmark after load 4x datum highlight',
    'multi-series benchmark after load 15x datum highlight',
];

const chartOptions1: AgCartesianChartOptions = {
    container: document.getElementById('myChart1'),
    autoSize: true,
    data: getData(),
    title: {
        text: 'Initial Load Cases',
        fontSize: 18,
    },
    series: initialLoadKeys.map((key) => ({
        type: 'bar' as const,
        xKey: 'name',
        yKey: `results['${key}']`,
        yName: key.replace(' initial load', '').replace(' benchmark', ''),
    })),
};

AgCharts.create(chartOptions1);

const chartOptions2: AgCartesianChartOptions = {
    container: document.getElementById('myChart2'),
    autoSize: true,
    data: getData(),
    title: {
        text: 'Legend Toggle',
        fontSize: 18,
    },
    series: [
        ...seriesToggleKeys.map((key) => ({
            type: 'bar' as const,
            xKey: 'name',
            yKey: `results['${key}']`,
            yName: key.replace(' legend toggle', '').replace(' benchmark after load', ''),
        })),
    ],
};

AgCharts.create(chartOptions2);

const chartOptions3: AgCartesianChartOptions = {
    container: document.getElementById('myChart3'),
    autoSize: true,
    data: getData(),
    title: {
        text: 'Datum Highlight',
        fontSize: 18,
    },
    series: [
        ...seriesHighlightKeys.map((key) => ({
            type: 'bar' as const,
            xKey: 'name',
            yKey: `results['${key}']`,
            yName: key.replace(' datum highlight', '').replace(' benchmark after load', ''),
        })),
    ],
};

AgCharts.create(chartOptions3);
