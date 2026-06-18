import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    CategoryAxisModule,
    HeatmapSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AnimationModule, CategoryAxisModule, HeatmapSeriesModule]);

const icon = (letter: string, fill: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">` +
            `<circle cx="14" cy="14" r="12" fill="${fill}"/>` +
            `<text x="14" y="19" text-anchor="middle" font-family="Verdana" font-size="13" fill="white" font-weight="bold">${letter}</text></svg>`
    )}`;

const ICONS: Record<string, string> = {
    Florian: icon('F', '#1f77b4'),
    Julian: icon('J', '#ff7f0e'),
    Martian: icon('M', '#2ca02c'),
};

const data = [
    { year: '2020', person: 'Florian', spending: 10 },
    { year: '2020', person: 'Julian', spending: 20 },
    { year: '2020', person: 'Martian', spending: 30 },
    { year: '2021', person: 'Florian', spending: 20 },
    { year: '2021', person: 'Julian', spending: 30 },
    { year: '2021', person: 'Martian', spending: 40 },
    { year: '2022', person: 'Florian', spending: 30 },
    { year: '2022', person: 'Julian', spending: 40 },
    { year: '2022', person: 'Martian', spending: 50 },
];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Block image labels in heatmap cells' },
    data,
    series: [
        {
            type: 'heatmap',
            xKey: 'year',
            yKey: 'person',
            colorKey: 'spending',
            label: {
                enabled: true,
                color: 'white',
                formatter: ({ datum }) => {
                    const d = datum as { person: string; spending: number };
                    return [
                        { type: 'image', url: ICONS[d.person], width: 20, height: 20, block: true },
                        { text: `${d.spending}` },
                    ];
                },
            },
        },
    ],
};

AgCharts.create(options);
