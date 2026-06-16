// Tests font-icon glyphs (FontAwesome) inline with text. Two things to know:
//   1. FontAwesome 6 Free ships solid (weight 900) and regular (weight 400)
//      as different files in the same family. Most icons (flag, arrows, star,
//      chart-line) live only in solid, so segments must set fontWeight: 900.
//   2. Canvas text rendering does not trigger font downloads. We inject the
//      FontAwesome stylesheet at runtime (so the example works identically
//      across frameworks) and create the chart once it has loaded. The chart
//      detects the icon fonts referenced in its options, downloads them, and
//      re-renders automatically once they are ready.
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

const ICON_FAMILY_SOLID = 'Font Awesome 6 Free';
const SOLID_WEIGHT = 900;

const ICON_STAR = '';
const ICON_CHART_LINE = '';
const ICON_FLAG = '';
const ICON_ARROW_UP = '';
const ICON_ARROW_DOWN = '';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: [
            { text: 'Top Markets ' },
            {
                text: ICON_STAR,
                fontFamily: ICON_FAMILY_SOLID,
                fontWeight: SOLID_WEIGHT,
                color: '#f1c40f',
                verticalAlign: 'middle',
            },
            { text: ' 2025', fontWeight: 'bold' },
        ],
        fontSize: 22,
    },
    subtitle: {
        text: [
            {
                text: `${ICON_CHART_LINE} `,
                fontFamily: ICON_FAMILY_SOLID,
                fontWeight: SOLID_WEIGHT,
                color: '#1f77b4',
                verticalAlign: 'middle',
            },
            { text: 'Quarterly revenue by country' },
        ],
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'country',
            yKey: 'revenue',
            yName: 'Revenue',
            tooltip: {
                renderer: (p) => ({ heading: p.datum[p.xKey] }),
            },
            label: {
                enabled: true,
                formatter: ({ datum }) => {
                    const d = datum as TData;
                    return [
                        { text: `${d.revenue}M `, fontWeight: 'bold' },
                        {
                            text: d.delta >= 0 ? ICON_ARROW_UP : ICON_ARROW_DOWN,
                            fontFamily: ICON_FAMILY_SOLID,
                            fontWeight: SOLID_WEIGHT,
                            color: d.delta >= 0 ? '#22c55e' : '#d62728',
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
                        text: `${ICON_FLAG} `,
                        fontFamily: ICON_FAMILY_SOLID,
                        fontWeight: SOLID_WEIGHT,
                        color: '#888',
                        verticalAlign: 'middle',
                    },
                    { text: String(value), fontWeight: 'bold' },
                ],
            },
        },
        y: {
            type: 'number',
            label: { formatter: ({ value }) => `$${value}M` },
        },
    },
};

// Inject the FontAwesome stylesheet and create the chart once its `@font-face` rules are
// registered. The font files themselves are not downloaded yet; the chart loads them and
// re-renders automatically.
const stylesheetReady = new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
    link.crossOrigin = 'anonymous';
    link.referrerPolicy = 'no-referrer';
    link.onload = () => resolve();
    document.head.appendChild(link);
});

stylesheetReady.then(() => AgCharts.create(options));
