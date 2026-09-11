import {
    AgCartesianChartOptions,
    AgCharts,
    AgFunnelSeriesLabelPlacement,
    AgFunnelSeriesOptions,
    AnimationModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    FunnelSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    FunnelSeriesModule,
    LegendModule,
    NumberAxisModule,
]);

const initialPlacement: AgFunnelSeriesLabelPlacement = 'inside-center';

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Conversion Drop Off',
    },
    subtitle: {
        text: initialPlacement,
    },
    animation: {
        enabled: false,
    },
    seriesArea: {
        padding: {
            top: 20,
            bottom: 20,
            left: 60,
            right: 60,
        },
    },
    series: [
        {
            type: 'funnel',
            stageKey: 'group',
            valueKey: 'value',
            direction: 'vertical',
            label: {
                enabled: true,
                placement: initialPlacement,
            },
            stageLabel: {
                placement: 'before',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function setPlacement(value: string) {
    (options.series![0] as AgFunnelSeriesOptions<DataType>).label!.placement = value as AgFunnelSeriesLabelPlacement;
    options.subtitle!.text = value;
    chart.update(options);
}

function setDirection(event: Event) {
    const direction = (event.target as HTMLInputElement).value as 'vertical' | 'horizontal';
    options.series = [{ ...(options.series![0] as AgFunnelSeriesOptions<DataType>), direction }];
    chart.update(options);
}

function setStageLabelPlacement(event: Event) {
    const placement = (event.target as HTMLInputElement).value as 'before' | 'after';
    options.series = [{ ...(options.series![0] as AgFunnelSeriesOptions<DataType>), stageLabel: { placement } }];
    chart.update(options);
}
