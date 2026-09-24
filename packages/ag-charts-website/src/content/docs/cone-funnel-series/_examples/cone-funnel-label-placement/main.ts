import {
    AgCartesianChartOptions,
    AgCharts,
    AgConeFunnelSeriesLabelPlacement,
    AgConeFunnelSeriesOptions,
    AnimationModule,
    CategoryAxisModule,
    ConeFunnelSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    ConeFunnelSeriesModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);

const initialPlacement: AgConeFunnelSeriesLabelPlacement = 'start-center';

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
            left: 20,
            right: 20,
        },
    },
    series: [
        {
            type: 'cone-funnel',
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
    (options.series![0] as AgConeFunnelSeriesOptions<DataType>).label!.placement =
        value as AgConeFunnelSeriesLabelPlacement;
    options.subtitle!.text = value;
    chart.update(options);
}

function setDirection(event: Event) {
    const direction = (event.target as HTMLInputElement).value as 'vertical' | 'horizontal';
    options.series = [{ ...(options.series![0] as AgConeFunnelSeriesOptions<DataType>), direction }];
    chart.update(options);
}

function setStageLabelPlacement(event: Event) {
    const placement = (event.target as HTMLInputElement).value as 'before' | 'after';
    options.series = [{ ...(options.series![0] as AgConeFunnelSeriesOptions<DataType>), stageLabel: { placement } }];
    chart.update(options);
}
