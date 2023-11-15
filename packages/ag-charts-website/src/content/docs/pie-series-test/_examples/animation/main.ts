import { AgChart, AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

const data = [
    { label: 'Android', value: 56.9 },
    { label: 'iOS', value: 22.5 },
    { label: 'BlackBerry', value: 6.8 },
    { label: 'Symbian', value: 8.5 },
    { label: 'Bada', value: 2.6 },
    { label: 'Windows', value: 1.9 },
];

const filter = (...labels: string[]) => {
    return (d: (typeof data)[number]) => labels.includes(d.label);
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data: data.filter(filter('Android', 'BlackBerry', 'Bada')),
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

const chart = AgEnterpriseCharts.create(options);

function reset() {
    options.data = data.filter(filter('Android', 'BlackBerry', 'Bada'));
    AgChart.update(chart, options as any);
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
    AgChart.update(chart, options);
}

function add() {
    const newData = [...data];
    options.data = newData;
    AgChart.update(chart, options);
}

function remove() {
    const newData = [...(options.data ?? [])];
    const indexToRemove = randomIndex(newData);

    newData.splice(indexToRemove, 1);
    options.data = newData;
    AgChart.update(chart, options);
}

function rapidUpdates() {
    reset();

    setTimeout(() => randomise(), 300);
    setTimeout(() => randomise(), 600);
    setTimeout(() => randomise(), 900);
}
