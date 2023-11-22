import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const data = [
    { label: 'Android', value: 56.9 },
    { label: 'iOS', value: 22.5 },
    { label: 'BlackBerry', value: 6.8 },
    { label: 'Symbian', value: 8.5 },
    { label: 'Bada', value: 2.6 },
    { label: 'Windows', value: 1.9 },
];

const moreLabels = ['SteamOS', 'ChromeOS', 'Palm OS'];

const filter = (...labels: string[]) => {
    return (d: (typeof data)[number]) => labels.includes(d.label);
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data: [...data],
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'label',
            sectorLabelKey: 'value',
            sectorLabel: {
                color: 'white',
                fontWeight: 'bold',
                formatter: ({ datum }) =>
                    datum['value'] ? `${Math.round(parseFloat(datum['value']) * 100) / 100}` : '',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function reset() {
    options.data = [...data];
    AgCharts.update(chart, options as any);
}

function randomIndex(array: unknown[]) {
    const index = Math.floor(Math.random() * array.length);
    return index;
}

function randomise() {
    options.data = [
        ...(options.data ?? []).map((d: any) => ({
            ...d,
            originalValue: d.originalValue ?? d.value,
            value: (d.originalValue ?? d.value) * (Math.random() * 5 + 0.5),
        })),
    ];
    AgCharts.update(chart, options);
}

function add(position: 'start' | 'end' = 'end') {
    const nextLabel = [...data.map(({ label }) => label), ...moreLabels].find(
        (l) => !options.data?.some((d) => d.label === l)
    );
    if (!nextLabel) return;

    const newDatum = { label: nextLabel, value: Math.random() * 5 + 0.5 };
    const newData = [...(options.data ?? [])];
    newData.splice(position === 'start' ? 0 : newData.length, 0, newDatum);

    options.data = newData;
    AgCharts.update(chart, options);
}

function remove(position: 'start' | 'end' = 'end') {
    const newData = [...(options.data ?? [])];
    newData.splice(position === 'start' ? 0 : -1, 1);

    options.data = newData;
    AgCharts.update(chart, options);
}

function shuffle() {
    const newData = [...(options.data ?? [])];
    newData.sort(() => Math.random() - 0.5);

    options.data = newData;
    AgCharts.update(chart, options);
}

function rapidUpdates() {
    reset();

    setTimeout(() => randomise(), 300);
    setTimeout(() => randomise(), 600);
    setTimeout(() => randomise(), 900);
}
