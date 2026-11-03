import {
    AgCharts,
    AgLinearGaugeOptions,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LinearGaugeModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([LinearGaugeModule, AnimationModule, CrosshairModule, LegendModule, ContextMenuModule]);
const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    direction: 'horizontal',
    container: document.getElementById('myChart'),
    value: 50,
    scale: {
        min: 0,
        max: 100,
    },
    targets: [
        {
            value: 30,
            text: 'Minimum',
            shape: 'triangle',
            placement: 'before',
            fill: 'white',
            strokeWidth: 2,
            spacing: 8,
            label: {
                fontSize: 12,
                fontWeight: 'bold',
                color: '#d14d41',
            },
        },
        {
            value: 75,
            text: 'Stretch',
            placement: 'after',
            shape: 'triangle',
            fill: 'white',
            strokeWidth: 2,
            spacing: 8,
            label: {
                fontSize: 14,
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
            },
        },
        {
            value: 90,
            placement: 'middle',
            shape: 'circle',
            fill: 'white',
            strokeWidth: 2,
            spacing: 8,
        },
    ],
};

AgCharts.createGauge(options);
