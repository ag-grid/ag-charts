import {
    HistogramSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AgCrosshairLabelRendererParams } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([HistogramSeriesModule, LegendModule, NumberAxisModule, TimeAxisModule]);
const crosshairLabelRenderer = ({ value }: AgCrosshairLabelRendererParams) => {
    return {
        text: `${(value / 1000000).toFixed(1)}M`,
        color: 'aliceBlue',
        backgroundColor: 'darkBlue',
        opacity: 0.8,
    };
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'histogram',
            yKey: 'bicycleHires',
            yName: 'Bicycle Hires',
            xKey: 'day',
            xName: 'Day',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Number of Bicycle Hires',
            },
            crosshair: {
                label: {
                    xOffset: 50,
                    renderer: crosshairLabelRenderer,
                },
            },
        },
        x: {
            type: 'time',
            position: 'bottom',
            crosshair: {
                label: {
                    format: `%b %d`,
                },
            },
        },
    },
    formatter: {
        y: (params) => `${(params.value as number) / 1000000}M`,
    },
};

AgCharts.create(options);
