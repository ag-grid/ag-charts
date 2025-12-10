// @ag-skip-fws
import type { AgChartInstance, AgChartOptions, AgZoomEvent } from 'ag-charts-enterprise';
import { AgCharts } from 'ag-charts-enterprise';

const meta = {
    'numberAxis-preserveDomain': {
        options: {
            data: [
                { x: 0, y: 0 },
                { x: 1, y: 50 },
                { x: 2, y: 25 },
                { x: 3, y: 75 },
                { x: 4, y: 50 },
                { x: 5, y: 25 },
                { x: 6, y: 50 },
                { x: 7, y: 75 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: {
                    type: 'number',
                    position: 'bottom',
                    nice: false,
                },
                y: {
                    type: 'number',
                    position: 'left',
                },
            },
            initialState: {
                zoom: {
                    rangeX: { start: 2.5, end: 5.75 },
                },
            },
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveDomain',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['numberAxis-preserveDomain'].options;
            return [...data, { x: 8, y: 50 }];
        },
        prependDatum: () => {
            const { data } = meta['numberAxis-preserveDomain'].options;
            return [{ x: -1, y: 50 }, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['numberAxis-preserveDomain'].options;
            return [...data.slice(0, 4), { x: 3.5, y: 50 }, ...data.slice(4)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['numberAxis-preserveDomain'].options;
            return [...data.slice(0, 4), { x: 3.5, y: -20 }, ...data.slice(4)];
        },
    },

    'numberAxis-preserveRatios': {
        options: {
            data: [
                { x: 0, y: 0 },
                { x: 1, y: 50 },
                { x: 2, y: 25 },
                { x: 3, y: 75 },
                { x: 4, y: 50 },
                { x: 5, y: 25 },
                { x: 6, y: 50 },
                { x: 7, y: 75 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: {
                    type: 'number',
                    position: 'bottom',
                    nice: false,
                },
                y: {
                    type: 'number',
                    position: 'left',
                },
            },
            initialState: {
                zoom: {
                    ratioX: { start: 0.25, end: 0.75 },
                },
            },
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveRatios',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['numberAxis-preserveRatios'].options;
            return [...data, { x: 8, y: 50 }];
        },
        prependDatum: () => {
            const { data } = meta['numberAxis-preserveRatios'].options;
            return [{ x: -1, y: 50 }, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['numberAxis-preserveRatios'].options;
            return [...data.slice(0, 4), { x: 3.5, y: 50 }, ...data.slice(4)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['numberAxis-preserveRatios'].options;
            return [...data.slice(0, 4), { x: 3.5, y: -20 }, ...data.slice(4)];
        },
    },

    'ordinalTimeAxis-preserveDomain': {
        options: {
            data: [
                { date: new Date('2024-04-19'), value: 60 }, // Friday
                // Skipping Saturday and Sunday
                { date: new Date('2024-04-22'), value: 10 }, // Monday
                { date: new Date('2024-04-23'), value: 20 }, // Tuesday
                // Skipping Wednesday (24th)
                { date: new Date('2024-04-25'), value: 40 }, // Thursday
                { date: new Date('2024-04-26'), value: 50 }, // Friday
                // Skipping Saturday and Sunday
                { date: new Date('2024-04-29'), value: 60 }, // Monday
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'date',
                    yKey: 'value',
                },
            ],
            axes: {
                x: {
                    type: 'ordinal-time',
                    position: 'bottom',
                    parentLevel: {
                        // Force more labels to show
                        enabled: true,
                    },
                },
                y: {
                    type: 'number',
                    position: 'left',
                },
            },

            initialState: {
                zoom: {
                    rangeX: {
                        start: { __type: 'date', value: '2024-04-23' },
                        end: { __type: 'date', value: '2024-04-25' },
                    },
                },
            },
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveDomain',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-30'), value: 50 }; // Tuesday
            return [...data, datum];
        },
        prependDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-18'), value: 50 }; // Thursday
            return [datum, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-24'), value: 30 }; // Wednesday
            return [...data.slice(0, 4), datum, ...data.slice(4)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['ordinalTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-24'), value: -20 }; // Wednesday
            return [...data.slice(0, 4), datum, ...data.slice(4)];
        },
    },

    'ordinalTimeAxis-preserveRatios': {
        options: {
            data: [
                { date: new Date('2024-04-19'), value: 60 }, // Friday
                // Skipping Saturday and Sunday
                { date: new Date('2024-04-22'), value: 10 }, // Monday
                { date: new Date('2024-04-23'), value: 20 }, // Tuesday
                // Skipping Wednesday (24th)
                { date: new Date('2024-04-25'), value: 40 }, // Thursday
                { date: new Date('2024-04-26'), value: 50 }, // Friday
                // Skipping Saturday and Sunday
                { date: new Date('2024-04-29'), value: 60 }, // Monday
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'date',
                    yKey: 'value',
                },
            ],
            axes: {
                x: {
                    type: 'ordinal-time',
                    position: 'bottom',
                    parentLevel: {
                        // Force more labels to show
                        enabled: true,
                    },
                },
                y: {
                    type: 'number',
                    position: 'left',
                },
            },

            initialState: {
                zoom: {
                    ratioX: { start: 0.25, end: 0.7 },
                },
            },
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveRatios',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-30'), value: 50 }; // Tuesday
            return [...data, datum];
        },
        prependDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-18'), value: 50 }; // Thursday
            return [datum, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-24'), value: 50 }; // Wednesday
            return [...data.slice(0, 4), datum, ...data.slice(4)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['ordinalTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-24'), value: -20 }; // Wednesday
            return [...data.slice(0, 4), datum, ...data.slice(4)];
        },
    },
};

const testOptions = {
    container: document.getElementById('myChart'),
    listeners: {
        zoom: (e: AgZoomEvent) => {
            setEvent(e);
            console.log(e);
        },
    },
    animation: {
        enabled: false,
    },
    width: 800,
    height: 600,
    theme: {
        baseTheme: 'ag-default',
        palette: {
            fills: ['#f3622d', '#fba71b', '#57b757', '#41a9c9', '#4258c9', '#9a42c8', '#c84164', '#888888'],
            strokes: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
        },
        params: {
            axisColor: '#c3c3c3',
            borderColor: '#dddddd',
            foregroundColor: '#464646',
            gridLineColor: '#e0eaf2',
            popupShadow: '0 2px 8px 0 color-mix(in srgb, black 8%, transparent)',
            textColor: '#464646',
            subtleTextColor: '#8c8c8c',
            chromeBackgroundColor: '#fafafa',
            buttonTextColor: '#464646',
            inputTextColor: '#464646',
            menuBackgroundColor: '#fafafa',
            panelBackgroundColor: '#fafafa',
            tooltipBackgroundColor: '#fafafa',
            crosshairLabelBackgroundColor: '#464646',
            crosshairLabelTextColor: 'white',
        },
    },
};

let chart: AgChartInstance | undefined;

function readMeta() {
    const elem = document.getElementById('meta') as HTMLOptionElement;
    const value = elem.value as keyof typeof meta;
    return meta[value];
}
function setEvent(o: unknown) {
    const json = JSON.stringify(o, null, 2);
    document.getElementById('event_json')!.textContent = `event: ${json}`;
}

function create() {
    if (chart) {
        chart.destroy();
    }
    setEvent(null);
    chart = AgCharts.create({ ...testOptions, ...readMeta().options } as AgChartOptions);
    (window as any).chart = chart; // for debugging
}

function appendDatum() {
    setEvent(null);
    chart?.updateDelta({ data: readMeta().appendDatum() });
}

function prependDatum() {
    setEvent(null);
    chart?.updateDelta({ data: readMeta().prependDatum() });
}

function insertMiddleDatum() {
    setEvent(null);
    chart?.updateDelta({ data: readMeta().insertMiddleDatum() });
}

function insertMiddleDatumNegative() {
    setEvent(null);
    chart?.updateDelta({ data: readMeta().insertMiddleDatumNegative() });
}

(() => {
    const bodyStyle = (document.querySelector('body') as HTMLElement).style;
    bodyStyle.overflow = 'auto';
    bodyStyle.display = 'block';
})();
