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
            `<circle cx="16" cy="16" r="14" fill="${fill}"/>` +
            `<text x="16" y="22" text-anchor="middle" font-family="Verdana" font-size="15" fill="white" font-weight="bold">${letter}</text></svg>`
    )}`;

const data = [
    { country: 'United States', value: 42, code: 'US' },
    { country: 'United Kingdom', value: 35, code: 'UK' },
    { country: 'Germany', value: 28, code: 'DE' },
    { country: 'Japan', value: 31, code: 'JP' },
    { country: 'Australia', value: 24, code: 'AU' },
];
const palette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];
const ICONS: Record<string, string> = Object.fromEntries(data.map((d, i) => [d.country, icon(d.code, palette[i])]));

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Rotated block image axis labels' },
    subtitle: { text: 'Long category labels rotated 45°, each with a leading block icon' },
    data,
    series: [{ type: 'bar', xKey: 'country', yKey: 'value' }],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            label: {
                rotation: 45,
                formatter: ({ value }) => [
                    { type: 'image', url: ICONS[value as string], width: 24, height: 24, block: true },
                    { text: `${value}` },
                ],
            },
        },
        y: { type: 'number', position: 'left' },
    },
};

AgCharts.create(options);
