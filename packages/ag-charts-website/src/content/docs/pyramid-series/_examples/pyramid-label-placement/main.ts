import {
    AgCharts,
    AgFunnelSeriesLabelPlacement,
    AgPyramidSeriesOptions,
    AgStandaloneChartOptions,
    AnimationModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    PyramidSeriesModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([AnimationModule, LegendModule, PyramidSeriesModule, ContextMenuModule]);

const initialPlacement: AgFunnelSeriesLabelPlacement = 'inside-center';

const options: AgStandaloneChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue Open by Sales Stage',
    },
    subtitle: {
        text: initialPlacement,
    },
    animation: {
        enabled: false,
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
            direction: 'vertical',
            label: {
                enabled: true,
                placement: initialPlacement,
            },
            stageLabel: {
                placement: 'before',
                spacing: 40,
            },
        },
    ],
};

const chart = AgCharts.create(options);

function setPlacement(value: string) {
    (options.series![0] as AgPyramidSeriesOptions<DataType>).label!.placement = value as AgFunnelSeriesLabelPlacement;
    options.subtitle!.text = value;
    chart.update(options);
}

function setDirection(event: Event) {
    const direction = (event.target as HTMLInputElement).value as 'vertical' | 'horizontal';
    options.series = [{ ...(options.series![0] as AgPyramidSeriesOptions<DataType>), direction }];
    chart.update(options);
}

function setStageLabelPlacement(event: Event) {
    const placement = (event.target as HTMLInputElement).value as 'before' | 'after';
    const series = options.series![0] as AgPyramidSeriesOptions<DataType>;
    options.series = [{ ...series, stageLabel: { ...series.stageLabel, placement } }];
    chart.update(options);
}
