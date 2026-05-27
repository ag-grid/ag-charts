// Tests font-icon glyphs (FontAwesome) inline with text. Two things to know:
//   1. FontAwesome 6 Free ships solid (weight 900) and regular (weight 400)
//      as different files in the same family. Most icons (flag, arrows, star,
//      chart-line) live only in solid, so segments must set fontWeight: 900.
//   2. Canvas text rendering does not trigger font downloads — only DOM usage
//      does. The <link> tag in index.html registers the @font-face rules, but
//      the woff2 file is not actually fetched until something on the page asks
//      for it. We force the fetch via document.fonts.load() and wait for it
//      before creating the chart. The existing `loadGoogleFonts` mechanism in
//      AG Charts only covers Google Fonts; arbitrary CSS-loaded fonts have no
//      built-in preload gate today.
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

Promise.all([
    document.fonts.load(`${SOLID_WEIGHT} 16px "${ICON_FAMILY_SOLID}"`),
    document.fonts.load(`400 16px "${ICON_FAMILY_SOLID}"`),
]).then(() => AgCharts.create(options));
