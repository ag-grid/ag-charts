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
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">` +
            `<rect x="2" y="2" width="32" height="32" rx="6" fill="${fill}"/>` +
            `<text x="18" y="24" text-anchor="middle" font-family="Verdana" font-size="18" fill="white" font-weight="bold">${letter}</text></svg>`
    )}`;

const A = icon('A', '#1f77b4');

// Block rows are left-anchored within the caption box, so textAlign only moves the single lines.
const blockText = (label: string) => [
    { type: 'image' as const, url: A, width: 32, height: 32, block: true, cornerRadius: 6 },
    { text: label, fontWeight: 'bold' as const },
    { text: '\nsecond line of text' },
];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { textAlign: 'left', text: blockText('Aligned left') },
    subtitle: { textAlign: 'center', text: blockText('Aligned center') },
    footnote: { textAlign: 'right', text: blockText('Aligned right') },
    data: [
        { x: 'A', y: 3 },
        { x: 'B', y: 6 },
        { x: 'C', y: 4 },
    ],
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
};

AgCharts.create(options);
