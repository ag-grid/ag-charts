import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const data = getData();
const allSeries: NonNullable<AgChartOptions<DataType>['series']> = [
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value1',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value2',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value3',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value4',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value5',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value6',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value7',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value8',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value9',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
    {
        type: 'area',
        xKey: 'date',
        yKey: 'value10',
        marker: {},
        label: {},
        strokeWidth: 5,
        stacked: true,
    },
];
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data,
    series: allSeries.slice(0, 2),
    axes: [
        {
            type: 'time',
            position: 'bottom',
            interval: { step: { unit: 'month', step: 2 } },
            label: {
                autoRotate: false,
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                autoRotate: false,
            },
        },
    ],
};

const chart = AgCharts.create(options as AgChartOptions<DataType>);

function genDataPoint(ref: Date | DataType, offsetDays: number) {
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
    options.data = [...data];
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
    const data = [...(options.data ?? [])];
    data.splice(data.length / 2 - 5, 10);
    options.data = data;
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
    const data = [...(options.data ?? [])];
    const { length } = data;
    for (const idx of [length / 4, length / 2, (length * 3) / 4]) {
        const dataIdx = Math.floor(idx);
        const [datum, nextDatum] = data.slice(dataIdx, dataIdx + 2);

        const date = new Date((datum.date.getTime() + nextDatum.date.getTime()) / 2);
        data.splice(dataIdx + 1, 0, genDataPoint({ ...datum, date }, 0));
    }
    options.data = data;
    chart.update(options);
}

function actionAddPointsBefore() {
    const data = [...(options.data ?? [])];

    const ref = data[0];
    data.splice(0, 0, genDataPoint(ref, -14), genDataPoint(ref, -7));
    options.data = data;
    chart.update(options);
}

function actionAddPointsAfter(count = 2) {
    const data = [...(options.data ?? [])];

    const [ref] = data.slice(-1);
    for (let idx = 0; idx < count; idx++) {
        data.push(genDataPoint(ref, (idx + 1) * 7));
    }

    options.data = data;
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
    options.data = (options.data ?? []).map((d: any) => ({
        ...d,
        value1: d.value1 ? d.value1 + Math.random() * 40 - 20 : d.value1,
        value2: d.value2 ? d.value2 + Math.random() * 40 - 20 : d.value2,
        value3: d.value3 ? d.value3 + Math.random() * 40 - 20 : d.value3,
        value4: d.value4 ? d.value4 + Math.random() * 40 - 20 : d.value4,
        value5: d.value5 ? d.value5 + Math.random() * 40 - 20 : d.value5,
        value6: d.value6 ? d.value6 + Math.random() * 40 - 20 : d.value6,
        value7: d.value7 ? d.value7 + Math.random() * 40 - 20 : d.value7,
        value8: d.value8 ? d.value8 + Math.random() * 40 - 20 : d.value8,
        value9: d.value9 ? d.value9 + Math.random() * 40 - 20 : d.value9,
        value10: d.value10 ? d.value10 + Math.random() * 40 - 20 : d.value10,
    }));
    chart.update(options);
}

function actionUpdatePointUndefined() {
    options.data = (options.data ?? []).map((d: any, idx: number) => ({
        ...d,
        value1: idx % 15 == 0 ? undefined : d.value1,
        value2: idx % 17 == 0 ? undefined : d.value2,
        value3: idx % 19 == 0 ? undefined : d.value3,
        value4: idx % 21 == 0 ? undefined : d.value4,
        value5: idx % 23 == 0 ? undefined : d.value5,
        value6: idx % 25 == 0 ? undefined : d.value6,
        value7: idx % 27 == 0 ? undefined : d.value7,
        value8: idx % 29 == 0 ? undefined : d.value8,
        value9: idx % 31 == 0 ? undefined : d.value9,
        value10: idx % 33 == 0 ? undefined : d.value10,
    }));
    chart.update(options);
}

function actionUpdatePointDefined() {
    options.data = (options.data ?? []).map((d: any) => ({
        ...d,
        value1: d.value1 ?? 100 + Math.random() * 40 - 20,
        value2: d.value2 ?? 100 + Math.random() * 40 - 20,
        value3: d.value3 ?? 100 + Math.random() * 40 - 20,
        value4: d.value4 ?? 100 + Math.random() * 40 - 20,
        value5: d.value5 ?? 100 + Math.random() * 40 - 20,
        value6: d.value6 ?? 100 + Math.random() * 40 - 20,
        value7: d.value7 ?? 100 + Math.random() * 40 - 20,
        value8: d.value8 ?? 100 + Math.random() * 40 - 20,
        value9: d.value9 ?? 100 + Math.random() * 40 - 20,
        value10: d.value10 ?? 100 + Math.random() * 40 - 20,
    }));
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

    tick = setInterval(() => actionAddPointsAfter(1), 1500);
}

function actionTickStartFast() {
    if (tick) clearInterval(tick);

    tick = setInterval(() => actionAddPointsAfter(1), 900);
}

function actionTickStop() {
    if (tick) clearInterval(tick);
}
