import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Food Nutrients and Blood Sugar Impact',
    },
    subtitle: {
        text: 'Detailed Profile per 100g Serving',
    },
    tooltip: {
        mode: 'shared',
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    theme: {
        overrides: {
            common: {
                legend: {
                    position: 'top',
                },
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
                        label: {
                            formatter: ({ value }) => value.toLocaleString(),
                        },
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
        },
        {
            type: 'line',
            xKey: 'food',
            xName: 'Food',
            yKey: 'bloodSugarSpike',
            yName: 'Blood Sugar Spike',
            interpolation: {
                type: 'smooth',
            },
        },
        {
            type: 'bar',
            xKey: 'food',
            xName: 'Food',
            yKey: 'protein',
            yName: 'Protein',
        },
        {
            type: 'bar',
            xKey: 'food',
            xName: 'Food',
            yKey: 'fat',
            yName: 'Fat',
        },
        {
            type: 'bar',
            xKey: 'food',
            xName: 'Food',
            yKey: 'carbohydrates',
            yName: 'Carbohydrates',
        },
        {
            type: 'bar',
            xKey: 'food',
            xName: 'Food',
            yKey: 'fiber',
            yName: 'Fiber',
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'number',
            keys: ['bloodSugarSpike'],
            thickness: 40,
            title: {
                text: 'Sugar Spike',
                spacing: 0,
            },
            interval: {
                values: [0, 20, 60, 80],
            },
        },
        {
            position: 'left',
            type: 'number',
            keys: ['calories'],
            label: {
                formatter: ({ value }) => `${value} kcal`,
            },
            thickness: 75,
        },

        {
            position: 'right',
            type: 'number',
            keys: ['protein', 'fat', 'carbohydrates', 'fiber'],
            label: {
                formatter: ({ value }) => `${value}g`,
            },
        },
        {
            position: 'bottom',
            type: 'grouped-category',
            depthOptions: [{ tick: { enabled: false } }, { tick: { enabled: false } }],
            bandHighlight: {
                enabled: true,
            },
        },
    ],
};

AgCharts.create(options);
