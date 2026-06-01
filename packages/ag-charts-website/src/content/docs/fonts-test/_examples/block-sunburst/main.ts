import { AgChartOptions, AgCharts, AnimationModule, ModuleRegistry, SunburstSeriesModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AnimationModule, SunburstSeriesModule]);

const icon = (letter: string, fill: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">` +
            `<circle cx="14" cy="14" r="12" fill="${fill}"/>` +
            `<text x="14" y="19" text-anchor="middle" font-family="Verdana" font-size="13" fill="white" font-weight="bold">${letter}</text></svg>`
    )}`;

const ICONS: Record<string, string> = {
    Solar: icon('S', '#1f77b4'),
    Earth: icon('E', '#2ca02c'),
    Mars: icon('M', '#d62728'),
    'Gas Giants': icon('G', '#ff7f0e'),
    Jupiter: icon('J', '#9467bd'),
    Saturn: icon('A', '#8c564b'),
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Block image labels in sunburst slices' },
    data: [
        {
            name: 'Solar',
            children: [
                { name: 'Earth', size: 60 },
                { name: 'Mars', size: 30 },
            ],
        },
        {
            name: 'Gas Giants',
            children: [
                { name: 'Jupiter', size: 80 },
                { name: 'Saturn', size: 50 },
            ],
        },
    ],
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'size',
            label: {
                formatter: ({ datum }) => {
                    const d = datum as { name: string };
                    return [
                        { type: 'image', url: ICONS[d.name], width: 18, height: 18, block: true },
                        { text: d.name },
                    ];
                },
            },
        },
    ],
};

AgCharts.create(options);
