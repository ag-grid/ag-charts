// Emoji and FontAwesome icons inline with text. The axis labels use number emoji, which render through
// native canvas with no API changes. The title uses FontAwesome glyphs, applied per segment via
// fontFamily/fontWeight. Solid FontAwesome icons live in the weight-900 file, so their segments
// set fontWeight: 900. The chart loads any referenced fonts and re-renders once they are ready.
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
// Keycap number emoji (U+0031..U+0035 + U+FE0F + U+20E3) rank each country by position.
const rankEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
const rankByCountry = new Map(data.map((d, i) => [d.country, rankEmoji[i]]));

const ICON_FAMILY_SOLID = 'Font Awesome 6 Free';
const SOLID_WEIGHT = 900;

const ICON_CHART_LINE = ''; // fa-chart-line
const ICON_STAR = ''; // fa-star

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: [
            {
                text: `${ICON_CHART_LINE} `,
                fontFamily: ICON_FAMILY_SOLID,
                fontWeight: SOLID_WEIGHT,
                color: '#1f77b4',
                verticalAlign: 'middle',
            },
            { text: 'Top Markets 2025', fontWeight: 'bold' },
            {
                text: ` ${ICON_STAR}`,
                fontFamily: ICON_FAMILY_SOLID,
                fontWeight: SOLID_WEIGHT,
                color: '#f1c40f',
                verticalAlign: 'middle',
            },
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
    data,
    series: [
        {
            type: 'bar',
            xKey: 'country',
            yKey: 'revenue',
            yName: 'Revenue',
            label: {
                enabled: true,
                formatter: ({ datum }) => `${(datum as TData).revenue}M`,
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: {
                formatter: ({ value }) => [
                    {
                        text: `${rankByCountry.get(String(value)) ?? ''} `,
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
