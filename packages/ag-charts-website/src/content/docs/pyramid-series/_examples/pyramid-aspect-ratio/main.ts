import {
    AgCharts,
    AgPyramidSeriesOptions,
    AgStandaloneChartOptions,
    AnimationModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    PyramidSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AnimationModule, LegendModule, PyramidSeriesModule, ContextMenuModule]);
const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue Open by Sales Stage',
    },
    seriesArea: {
        padding: {
            left: 20,
            right: 20,
        },
    },
    series: [
        {
            type: 'pyramid',
            stageKey: 'group',
            valueKey: 'value',
            aspectRatio: 3 / 2,
            label: {
                enabled: false,
            },
        },
    ],
};

const chart = AgCharts.create(options);

const ASPECT_RATIOS: Record<string, number> = {
    '2-3': 2 / 3,
    equilateral: 1.1547,
    '3-2': 3 / 2,
};

function directionChange(event: Event) {
    const direction = (event.target as HTMLInputElement).value as 'horizontal' | 'vertical';
    (options.series![0] as AgPyramidSeriesOptions).direction = direction;
    chart.update(options);
}

function aspectRatioChange(event: Event) {
    const aspectRatio = ASPECT_RATIOS[(event.target as HTMLInputElement).value];
    (options.series![0] as AgPyramidSeriesOptions).aspectRatio = aspectRatio;
    chart.update(options);
}
