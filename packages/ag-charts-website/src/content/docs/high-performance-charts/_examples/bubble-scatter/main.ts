import { AgCartesianChartOptions, AgCartesianSeriesOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

// @ts-expect-error Undocumented option
window.agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(1e4),
    animation: { enabled: false },
    zoom: {
        enabled: true,
        axes: 'xy',
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        autoScaling: {
            enabled: false,
        },
        minVisibleItems: 0,
    },
    series: [
        {
            type: 'bubble',
            xKey: 'x',
            yKey: 'y',
            sizeKey: 'size',
            // @ts-expect-error Undocumented option
            maxVisibleItems: 2000,
        },
    ],
    theme: {
        overrides: {
            bubble: {
                series: {
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                },
            },
            scatter: {
                series: {
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                },
            },
        },
    },
};

const chart = AgCharts.create(options);

function setSeries(type: string) {
    const { maxVisibleItems, shape } = options.series?.[0] as any;

    let series: AgCartesianSeriesOptions;
    switch (type) {
        case 'bubble':
            series = {
                type: 'bubble',
                xKey: 'x',
                yKey: 'y',
                sizeKey: 'size',
                shape,
                // @ts-expect-error Undocumented option
                maxVisibleItems,
            };
            break;
        case 'scatter':
            series = {
                type: 'scatter',
                xKey: 'x',
                yKey: 'y',
                shape,
                // @ts-expect-error Undocumented option
                maxVisibleItems,
            };
            break;
        default:
            return;
    }

    options.series = [series];
    chart.update(options);
}

function setShape(shape: string) {
    let series = options.series?.[0] as any;
    series.shape = shape;

    options.series = [series];
    chart.update(options);
}

function setMaxVisibleItems(maxVisibleItems: number) {
    let series = options.series?.[0] as any;
    series.maxVisibleItems = maxVisibleItems;

    options.series = [series];
    chart.update(options);
}

function setData(points: number) {
    options.data = getData(points);
    chart.update(options);
}
