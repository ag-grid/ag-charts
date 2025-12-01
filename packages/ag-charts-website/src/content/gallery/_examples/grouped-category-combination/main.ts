import {
    AgCartesianChartOptions,
    AgCharts,
    AreaSeriesModule,
    BandHighlightModule,
    BarSeriesModule,
    ContextMenuModule,
    GroupedCategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    BandHighlightModule,
    BarSeriesModule,
    GroupedCategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
]);
const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Food Nutrients and Blood Sugar Impact',
    },
    subtitle: {
        text: 'Detailed Profile per 100g Serving',
        spacing: 50,
    },
    theme: {
        overrides: {
            common: {
                axes: {
                    'grouped-category': {
                        groupPaddingInner: 0,
                        paddingInner: 0.3,
                        line: {
                            width: 2,
                        },
                        gridLine: {
                            enabled: false,
                        },
                    },
                    number: {
                        line: {
                            enabled: true,
                        },
                        tick: {
                            enabled: true,
                        },
                        gridLine: {
                            style: [
                                {
                                    strokeWidth: 1,
                                    lineDash: [2, 2],
                                },
                                {
                                    strokeWidth: 0,
                                },
                            ],
                        },
                    },
                },
            },
            line: {
                series: {
                    marker: {
                        enabled: false,
                    },
                },
            },
            area: {
                series: {
                    fillOpacity: 0.4,
                    marker: {
                        fillOpacity: 0.4,
                        size: 0,
                        shape: 'triangle',
                    },
                },
            },
            bar: {
                series: {
                    cornerRadius: 3,
                    strokeWidth: 1,
                },
            },
        },
    },
    padding: {
        left: 10,
        right: 10,
    },
    series: [
        {
            type: 'area',
            xKey: 'food',
            xName: 'Food',
            yKey: 'calories',
            yName: 'Calories',
            yKeyAxis: 'yCalories',
        },
        {
            type: 'line',
            xKey: 'food',
            xName: 'Food',
            yKey: 'bloodSugarSpike',
            yName: 'Blood Sugar Spike',
            yKeyAxis: 'ySugar',
            interpolation: {
                type: 'smooth',
            },
        },
        {
            type: 'bar',
            xKey: 'food',
            xName: 'Food',
            yKey: 'fiber',
            yName: 'Fiber',
            yKeyAxis: 'yGrams',
        },
        {
            type: 'bar',
            xKey: 'food',
            xName: 'Food',
            yKey: 'carbohydrates',
            yName: 'Carbohydrates',
            yKeyAxis: 'yGrams',
        },
        {
            type: 'bar',
            xKey: 'food',
            xName: 'Food',
            yKey: 'protein',
            yName: 'Protein',
            yKeyAxis: 'yGrams',
        },
        {
            type: 'bar',
            xKey: 'food',
            xName: 'Food',
            yKey: 'fat',
            yName: 'Fat',
            yKeyAxis: 'yGrams',
        },
    ],
    axes: {
        ySugar: {
            position: 'left',
            type: 'number',
            thickness: 40,
            title: {
                text: 'Sugar Spike',
                spacing: 0,
            },
            interval: {
                values: [0, 20, 60, 80],
            },
        },
        yCalories: {
            position: 'left',
            type: 'number',
            label: {
                formatter: ({ value }) => `${value} kcal`,
            },
            thickness: 75,
        },
        yGrams: {
            position: 'right',
            type: 'number',
            label: {
                formatter: ({ value }) => `${value}g`,
            },
        },
        x: {
            position: 'bottom',
            type: 'grouped-category',
            depthOptions: [{ tick: { enabled: false } }, { tick: { enabled: false } }],
            bandHighlight: {
                enabled: true,
            },
        },
    },
    legend: {
        maxWidth: 300,
        position: {
            floating: true,
            placement: 'top-left',
            xOffset: 20,
            yOffset: 20,
        },
        border: {
            enabled: true,
        },
    },
    tooltip: {
        enabled: true,
        mode: 'shared',
        position: {
            anchorTo: 'chart',
            placement: ['top-right'],
            xOffset: -80,
            yOffset: 20,
        },
    },
};

AgCharts.create(options);
