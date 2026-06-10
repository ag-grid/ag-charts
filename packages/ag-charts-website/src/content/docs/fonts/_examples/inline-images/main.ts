// Inline images in chart labels: a flag image next to each country code on the
// axis, a small trend-arrow next to each value on the data labels, and an image
// segment in the title. Image segments share the line with text segments via
// the `TextSegment[]` / `ImageSegment[]` union accepted at every label site.
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

const arrowUp =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="#22c55e" d="M8 2 14 12H2z"/></svg>'
    );
const arrowDown =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="#d62728" d="M8 14 2 4h12z"/></svg>'
    );

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: [
            { text: 'Top Markets ' },
            {
                type: 'image',
                url: '${baseWWWUrl}/example-assets/flags/us.png',
                width: 24,
                height: 18,
                verticalAlign: 'middle',
            },
            { text: ' 2025', fontWeight: 'bold' },
        ],
        fontSize: 22,
    },
    subtitle: {
        text: 'Quarterly revenue by country',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'code',
            yKey: 'revenue',
            yName: 'Revenue',
            label: {
                enabled: true,
                formatter: ({ datum }) => {
                    const d = datum as TData;
                    return [
                        { text: `${d.revenue}M `, fontWeight: 'bold' },
                        {
                            type: 'image',
                            url: d.delta >= 0 ? arrowUp : arrowDown,
                            width: 12,
                            height: 12,
                            verticalAlign: 'middle',
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
                        type: 'image',
                        url: '${baseWWWUrl}/example-assets/flags/' + `${value}.png`,
                        width: 20,
                        height: 15,
                        verticalAlign: 'middle',
                    },
                    { text: ` ${String(value).toUpperCase()}`, fontWeight: 'bold' },
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
