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
    chart.update(options as any);
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
    chart.update(options);
}

function addData(position: 'start' | 'mid' | 'end' | number = 'end', inData: any[]) {
    const nextLabel = [...data.map(({ label }) => label), ...moreLabels].find(
        (l) => !inData?.some((d) => d.label === l)
    );
    if (!nextLabel) return inData;

    const newDatum = { label: nextLabel, value: Math.random() * 5 + 0.5 };
    const newData = [...(inData ?? [])];
    let newPosition = 0;
    if (typeof position === 'number') newPosition = position;
    if (position === 'start') newPosition = 0;
    if (position === 'mid') newPosition = Math.floor(newData.length / 2);
    if (position === 'end') newPosition = newData.length;
    newData.splice(newPosition, 0, newDatum);
    return newData;
}

function add(position: 'start' | 'mid' | 'end' = 'end') {
    options.data = addData(position, options.data!);
    chart.update(options);
}

function removeData(position: 'start' | 'mid' | 'end' | number = 'end', inData: any[]) {
    const newData = [...(inData ?? [])];

    let index = 0;
    if (typeof position === 'number') index = position;
    if (position === 'start') index = 0;
    if (position === 'mid') index = Math.floor(newData.length / 2);
    if (position === 'end') index = -1;
    newData.splice(index, 1);

    return newData;
}

function remove(position: 'start' | 'mid' | 'end' = 'end') {
    options.data = removeData(position, options.data!);
    chart.update(options);
}

function change() {
    const index = Math.floor(options.data!.length / 2);
    options.data = removeData(index, addData(index + 1, options.data!));
    chart.update(options);
}

function shuffle() {
    const newData = [...(options.data ?? [])];
    newData.sort(() => Math.random() - 0.5);

    options.data = newData;
    chart.update(options);
}

function rapidUpdates() {
    reset();

    setTimeout(() => randomise(), 300);
    setTimeout(() => randomise(), 600);
    setTimeout(() => randomise(), 900);
}
