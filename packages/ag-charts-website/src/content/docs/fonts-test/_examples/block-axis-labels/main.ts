import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AnimationModule, BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const icon = (letter: string, fill: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">` +
            `<rect x="1" y="1" width="30" height="30" rx="6" fill="${fill}"/>` +
            `<text x="16" y="22" text-anchor="middle" font-family="Verdana" font-size="16" fill="white" font-weight="bold">${letter}</text></svg>`
    )}`;

const ICONS: Record<string, string> = {
    Mon: icon('M', '#1f77b4'),
    Tue: icon('T', '#ff7f0e'),
    Wed: icon('W', '#2ca02c'),
    Thu: icon('H', '#d62728'),
    Fri: icon('F', '#9467bd'),
};
const STAR = icon('*', '#8c564b');

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Block image axis labels' },
    subtitle: { text: 'x-axis: block + inline mix · y-axis: block-leading labels' },
    data: [
        { day: 'Mon', value: 4, label: 'Low' },
        { day: 'Tue', value: 7, label: 'High' },
        { day: 'Wed', value: 3, label: 'Low' },
        { day: 'Thu', value: 6, label: 'Mid' },
        { day: 'Fri', value: 5, label: 'Mid' },
    ],
    series: [{ type: 'bar', xKey: 'day', yKey: 'value' }],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            label: {
                // Block image, the day text, then an inline star marker.
                formatter: ({ value }) => [
                    { type: 'image', url: ICONS[value as string], width: 26, height: 26, block: true },
                    { text: `${value} ` },
                    { type: 'image', url: STAR, width: 14, height: 14, verticalAlign: 'middle' },
                ],
            },
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                // Numeric y labels also get a leading block icon.
                formatter: ({ value }) => [
                    { type: 'image', url: STAR, width: 16, height: 16, block: true, cornerRadius: 4 },
                    { text: `${value}` },
                ],
            },
        },
    },
};

AgCharts.create(options);
