import {
    AgCartesianChartOptions,
    AgCharts,
    AgGroupedCategoryAxisOptions,
    AgGroupedCategoryAxisThemeOptions,
} from 'ag-charts-enterprise';

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
                    } as AgGroupedCategoryAxisThemeOptions,
                    number: {
                        gridLine: {
                            enabled: true,
                        },
                        label: {
                            formatter: ({ value }) => value.toLocaleString(),
                        },
                        line: {
                            enabled: true,
                        },
                        tick: {
                            enabled: true,
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
                    fillOpacity: 0.1,
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
            showInLegend: false,
        },
        {
            type: 'line',
            xKey: 'food',
            xName: 'Food',
            yKey: 'bloodSugarSpike',
            yName: 'Blood Sugar Spike',
            showInLegend: false,
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
            thickness: 30,
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
            depthOptions: [{ label: { fontSize: 11 } }, { label: { fontSize: 10 } }, { label: { fontSize: 10 } }],
        } as AgGroupedCategoryAxisOptions,
    ],
};

AgCharts.create(options);
