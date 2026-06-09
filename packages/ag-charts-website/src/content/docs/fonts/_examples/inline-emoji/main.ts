// Tests emoji rendered through native canvas fillText across captions, axis
// labels, and series labels. The larger flag glyph on the axis uses
// `verticalAlign: 'middle'` so it centres against the country-code text
// instead of sharing its alphabetic baseline.
import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { TData, getData } from './data';

ModuleRegistry.registerModules([AnimationModule, BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const data = getData();
const flagByCountry = new Map(data.map((d) => [d.country, d.flag]));

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: [{ text: '📈 ' }, { text: 'Top Markets', fontWeight: 'bold' }, { text: ' 💼' }],
        fontSize: 22,
    },
    subtitle: {
        text: 'Quarterly revenue by country',
    },
    data,
    series: [
        {
            type: 'bar',
            xKey: 'country',
            yKey: 'revenue',
            yName: 'Revenue',
            label: {
                enabled: true,
                formatter: ({ datum }) => {
                    const d = datum as TData;
                    return [
                        { text: `${d.revenue}M `, fontWeight: 'bold' },
                        {
                            text: d.delta >= 0 ? '⬆' : '⬇',
                            color: d.delta >= 0 ? '#22c55e' : '#d62728',
                            fontSize: 14,
                        },
                    ];
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: {
                formatter: ({ value }) => [
                    {
                        text: `${flagByCountry.get(String(value)) ?? ''}`,
                        fontSize: 18,
                        verticalAlign: 'middle',
                    },
                    { text: String(value), fontWeight: 'bold', verticalAlign: 'middle' },
                ],
            },
        },
        y: {
            type: 'number',
            label: { formatter: ({ value }) => `$${value}M` },
        },
    },
};

AgCharts.create(options);
