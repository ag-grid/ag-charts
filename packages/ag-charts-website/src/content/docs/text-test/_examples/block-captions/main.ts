import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AnimationModule, CategoryAxisModule, LineSeriesModule, NumberAxisModule]);

const icon = (letter: string, fill: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">` +
            `<rect x="2" y="2" width="36" height="36" rx="8" fill="${fill}"/>` +
            `<text x="20" y="27" text-anchor="middle" font-family="Verdana" font-size="20" fill="white" font-weight="bold">${letter}</text></svg>`
    )}`;

const A = icon('A', '#1f77b4');
const B = icon('B', '#d62728');
const INLINE = icon('i', '#2ca02c');

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    // Title: two stacked block rows (block, text, `\n`, block, text), with decorated block images.
    title: {
        text: [
            {
                type: 'image',
                url: A,
                width: 40,
                height: 40,
                block: true,
                cornerRadius: 8,
                padding: 4,
                backgroundFill: '#eef3fb',
            },
            { text: 'Annual Report', fontWeight: 'bold' },
            { text: '\nFiscal Year 2025\n' },
            {
                type: 'image',
                url: B,
                width: 40,
                height: 40,
                block: true,
                cornerRadius: 8,
                padding: 4,
                backgroundFill: '#fdeeee',
            },
            { text: 'Q4 Highlights', fontStyle: 'italic', verticalAlign: 'middle' },
        ],
        fontSize: 22,
        maxHeight: 100,
    },
    // Subtitle: block image followed by an inline image inside the same line.
    subtitle: {
        text: [
            { type: 'image', url: A, width: 24, height: 24, block: true, cornerRadius: 6 },
            { text: 'Region ' },
            { type: 'image', url: INLINE, width: 16, height: 16, verticalAlign: 'middle' },
            { text: ' overview, year over year' },
        ],
    },
    // Footnote: an oversized block image that exceeds the available width — the default `hide`
    // overflow strategy drops it and the text must still render.
    footnote: {
        text: [
            { type: 'image', url: B, width: 800, height: 800, block: true },
            { text: 'Oversized image dropped; this footnote text survives.' },
        ],
    },
    data: [
        { quarter: 'Q1', revenue: 500 },
        { quarter: 'Q2', revenue: 750 },
        { quarter: 'Q3', revenue: 1000 },
        { quarter: 'Q4', revenue: 1200 },
    ],
    series: [{ type: 'line', xKey: 'quarter', yKey: 'revenue', yName: 'Revenue' }],
};

AgCharts.create(options);
