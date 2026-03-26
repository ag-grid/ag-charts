import { AgCartesianChartOptions, AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const allSeries: NonNullable<AgChartOptions['series']> = [
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value1',
        marker: {},
        label: {},
        stacked: true,
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value2',
        marker: {},
        label: {},
        stacked: true,
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value3',
        marker: {},
        label: {},
        stacked: true,
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value4',
        marker: {},
        label: {},
        stacked: true,
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value5',
        marker: {},
        label: {},
        stacked: true,
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value6',
        marker: {},
        label: {},
        stacked: true,
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value7',
        marker: {},
        label: {},
        stacked: true,
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value8',
        marker: {},
        label: {},
        stacked: true,
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value9',
        marker: {},
        label: {},
        stacked: true,
    },
    {
        type: 'line',
        xKey: 'date',
        yKey: 'value10',
        marker: {},
        label: {},
        stacked: true,
    },
];
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    legend: {},
    data: getData(),
    series: allSeries.slice(0, 2),
    axes: {
        x: {
            type: 'time',
        },
        y: {
            type: 'number',
            label: {
                autoRotate: false,
            },
        },
    },
};

const chart = AgCharts.create(options);

function genDataPoint(ref: Date | DataType, offsetDays: number): DataType {
    const {
        date,
        value1 = 120,
        value2 = 125,
        value3 = 130,
        value4 = 118,
        value5 = 122,
        value6 = 127,
        value7 = 119,
        value8 = 124,
        value9 = 129,
        value10 = 121,
    } = ref instanceof Date ? { date: ref } : ref;

    return {
        date: new Date(date.getTime() + offsetDays * 3600 * 24 * 1000),
        value1: value1 + Math.random() * 4 - 2,
        value2: value2 + Math.random() * 4 - 2,
        value3: value3 + Math.random() * 4 - 2,
        value4: value4 + Math.random() * 4 - 2,
        value5: value5 + Math.random() * 4 - 2,
        value6: value6 + Math.random() * 4 - 2,
        value7: value7 + Math.random() * 4 - 2,
        value8: value8 + Math.random() * 4 - 2,
        value9: value9 + Math.random() * 4 - 2,
        value10: value10 + Math.random() * 4 - 2,
    };
}

function times<T>(cb: () => T, count: number) {
    const result: T[] = [];
    for (; count > 0; count--) {
        result.push(cb());
    }
    return result;
}

function actionReset() {
    options.data = getData();
    chart.update(options);
}

function actionAddSeries() {
    const currentCount = options.series!.length;
    if (currentCount >= 10) {
        return; // Limit to 10 series (matching available data keys)
    }
    options.series = [...options.series!, allSeries[currentCount]] as any;
    chart.update(options);
}

function actionRemoveSeries() {
    options.series = options.series!.slice(0, options.series!.length - 1);
    chart.update(options);
}

function actionRemovePoints() {
    options.data = [...(options.data ?? [])];
    options.data.splice(options.data.length / 2 - 5, 10);
    chart.update(options);
}

function actionRemoveFirstPoint() {
    options.data = [...(options.data ?? []).slice(1)];
    chart.update(options);
}

function actionRemoveLastPoint() {
    options.data = [...(options.data ?? []).slice(0, -1)];
    chart.update(options);
}

function actionRemoveHalf() {
    const data = options.data ?? [];
    const { length } = data;
    options.data = data.slice(Math.floor((length * 1) / 4), Math.floor((length * 3) / 4));

    chart.update(options);
}

function actionAddPoints() {
    options.data = [...(options.data ?? [])];
    const { length } = options.data;
    for (const idx of [length / 4, length / 2, (length * 3) / 4]) {
        const dataIdx = Math.floor(idx);
        const [datum, nextDatum] = options.data.slice(dataIdx, dataIdx + 2);

        const date = new Date((datum.date.getTime() + nextDatum.date.getTime()) / 2);
        options.data.splice(dataIdx + 1, 0, genDataPoint({ ...datum, date }, 0));
    }
    chart.update(options);
}

function actionAddPointsBefore() {
    options.data = [...(options.data ?? [])];

    const ref = options.data[0];
    options.data.splice(0, 0, genDataPoint(ref, -14), genDataPoint(ref, -7));
    chart.update(options);
}

function actionAddPointsAfter(count = 2) {
    options.data = [...(options.data ?? [])];

    const [ref] = options.data.slice(-1);
    for (let idx = 0; idx < count; idx++) {
        options.data.push(genDataPoint(ref, (idx + 1) * 7));
    }
    chart.update(options);
}

function actionAddDouble() {
    const data = options.data ?? [];
    const { length } = data;

    const count = Math.ceil(length / 4);
    let start = genDataPoint(data[0], -7 * (count + 1));
    let [end] = data.slice(-1);
    options.data = [
        ...times(() => (start = genDataPoint(start, 7)), count),
        ...data,
        ...times(() => (end = genDataPoint(end, 7)), count),
    ];
    chart.update(options);
}

function actionUpdatePoints() {
    options.data = (options.data ?? []).map((d: DataType) => ({
        ...d,
        value1: d.value1 + Math.random() * 4 - 2,
        value2: d.value2 + Math.random() * 4 - 2,
        value3: d.value3 + Math.random() * 4 - 2,
        value4: d.value4 + Math.random() * 4 - 2,
        value5: d.value5 + Math.random() * 4 - 2,
        value6: d.value6 + Math.random() * 4 - 2,
        value7: d.value7 + Math.random() * 4 - 2,
        value8: d.value8 + Math.random() * 4 - 2,
        value9: d.value9 + Math.random() * 4 - 2,
        value10: d.value10 + Math.random() * 4 - 2,
    }));
    chart.update(options);
}

function actionUpdatePointUndefined() {
    options.data = (options.data ?? []).map(
        (d: DataType) =>
            ({
                ...d,
                value1: Math.random() > 0.9 ? undefined : d.value1,
                value2: Math.random() > 0.9 ? undefined : d.value2,
                value3: Math.random() > 0.9 ? undefined : d.value3,
                value4: Math.random() > 0.9 ? undefined : d.value4,
                value5: Math.random() > 0.9 ? undefined : d.value5,
                value6: Math.random() > 0.9 ? undefined : d.value6,
                value7: Math.random() > 0.9 ? undefined : d.value7,
                value8: Math.random() > 0.9 ? undefined : d.value8,
                value9: Math.random() > 0.9 ? undefined : d.value9,
                value10: Math.random() > 0.9 ? undefined : d.value10,
            }) as DataType
    );
    chart.update(options);
}

function actionShiftLeft() {
    const data = options.data ?? [];
    const [ref] = data.slice(-1);
    options.data = [...data.slice(1), genDataPoint(ref, 7)];

    chart.update(options);
}

function actionShiftRight() {
    const data = options.data ?? [];
    const [ref] = data.slice(0);
    options.data = [genDataPoint(ref, -7), ...data.slice(0, -1)];

    chart.update(options);
}

let tick: NodeJS.Timeout;
function actionTickStart() {
    if (tick) clearInterval(tick);

    tick = setInterval(() => actionAddPointsAfter(1), 1000);
}

function actionTickStop() {
    if (tick) clearInterval(tick);
}
