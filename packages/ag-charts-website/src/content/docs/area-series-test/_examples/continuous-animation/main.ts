import { AgChartOptions, AgCharts, time } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    legend: {
        // enabled: false,
    },
    data,
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'petrol',
            marker: {},
            label: {},
            strokeWidth: 5,
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'diesel',
            marker: {},
            label: {},
            strokeWidth: 5,
            stacked: true,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            tick: {
                interval: time.month.every(2),
            },
            label: {
                autoRotate: false,
            },
        },
        {
            position: 'left',
            type: 'number',
            label: {
                autoRotate: false,
            },
        },
    ],
};

const chart = AgCharts.create(options);

function genDataPoint(ref: Date | { date: Date; petrol: number; diesel: number }, offsetDays: number) {
    const { date, petrol = 120, diesel = 125 } = ref instanceof Date ? { date: ref } : ref;

    return {
        date: new Date(date.getTime() + offsetDays * 3600 * 24 * 1000),
        petrol: petrol + Math.random() * 4 - 2,
        diesel: diesel + Math.random() * 4 - 2,
    };
}

function times<T>(cb: () => T, count: number) {
    const result = [];
    for (; count > 0; count--) {
        result.push(cb());
    }
    return result;
}

function actionReset() {
    options.data = [...data];
    AgCharts.update(chart, options);
}

function actionRemovePoints() {
    options.data = [...(options.data ?? [])];
    options.data.splice(options.data.length / 2 - 5, 10);
    AgCharts.update(chart, options);
}

function actionRemoveFirstPoint() {
    options.data = [...(options.data ?? []).slice(1)];
    AgCharts.update(chart, options);
}

function actionRemoveLastPoint() {
    options.data = [...(options.data ?? []).slice(0, -1)];
    AgCharts.update(chart, options);
}

function actionRemoveHalf() {
    const data = options.data ?? [];
    const { length } = data;
    options.data = data.slice(Math.floor((length * 1) / 4), Math.floor((length * 3) / 4));

    AgCharts.update(chart, options);
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
    AgCharts.update(chart, options);
}

function actionAddPointsBefore() {
    options.data = [...(options.data ?? [])];

    const ref = options.data[0];
    options.data.splice(0, 0, genDataPoint(ref, -14), genDataPoint(ref, -7));
    AgCharts.update(chart, options);
}

function actionAddPointsAfter(count = 2) {
    options.data = [...(options.data ?? [])];

    const [ref] = options.data.slice(-1);
    for (let idx = 0; idx < count; idx++) {
        options.data.push(genDataPoint(ref, (idx + 1) * 7));
    }
    AgCharts.update(chart, options);
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
    AgCharts.update(chart, options);
}

function actionUpdatePoints() {
    options.data = (options.data ?? []).map((d: any) => ({
        ...d,
        petrol: d.petrol ? d.petrol + Math.random() * 40 - 20 : d.petrol,
        diesel: d.diesel ? d.diesel + Math.random() * 40 - 20 : d.diesel,
    }));
    AgCharts.update(chart, options);
}

function actionUpdatePointUndefined() {
    options.data = (options.data ?? []).map((d: any, idx: number) => ({
        ...d,
        petrol: idx % 15 == 0 ? undefined : d.petrol,
        diesel: idx % 20 == 0 ? undefined : d.diesel,
    }));
    AgCharts.update(chart, options);
}

function actionUpdatePointDefined() {
    options.data = (options.data ?? []).map((d: any) => ({
        ...d,
        petrol: d.petrol ?? 100 + Math.random() * 40 - 20,
        diesel: d.diesel ?? 100 + Math.random() * 40 - 20,
    }));
    AgCharts.update(chart, options);
}

function actionShiftLeft() {
    const data = options.data ?? [];
    const [ref] = data.slice(-1);
    options.data = [...data.slice(1), genDataPoint(ref, 7)];

    AgCharts.update(chart, options);
}

function actionShiftRight() {
    const data = options.data ?? [];
    const [ref] = data.slice(0);
    options.data = [genDataPoint(ref, -7), ...data.slice(0, -1)];

    AgCharts.update(chart, options);
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
