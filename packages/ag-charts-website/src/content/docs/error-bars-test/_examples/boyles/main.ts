import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getArgon, getHelium, getOxygen } from './data';

type Datum = ReturnType<typeof getArgon>[number];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Volume-Pressure Relationship with Confidence Intervals',
    },
    axes: [
        // Note: axis configuration is required only for line series.
        // The bottom axis defaults to 'number' for scatter series.
        { type: 'number', position: 'left' },
        { type: 'number', position: 'bottom' },
    ],
    series: [
        {
            data: getOxygen(),
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            title: 'Oxygen',
            errorBar: {
                xLowerKey: 'volumeLower',
                xUpperKey: 'volumeUpper',
                yLowerKey: 'pressureLower',
                yUpperKey: 'pressureUpper',
            },
        },
        {
            data: getHelium(),
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            title: 'Helium',
            errorBar: {
                xLowerKey: 'volumeLower',
                xUpperKey: 'volumeUpper',
                yLowerKey: 'pressureLower',
                yUpperKey: 'pressureUpper',
            },
        },
        {
            data: getArgon(),
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            title: 'Argon',
            errorBar: {
                xLowerKey: 'volumeLower',
                xUpperKey: 'volumeUpper',
                yLowerKey: 'pressureLower',
                yUpperKey: 'pressureUpper',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function scatter() {
    if (options.series !== undefined) {
        for (const series of options.series) {
            series.type = 'scatter';
        }
    }
    chart.update(options);
}

function line() {
    if (options.series !== undefined) {
        for (const series of options.series) {
            series.type = 'line';
        }
    }
    chart.update(options);
}

function resetData() {
    if (options.series !== undefined) {
        options.series[0].data = getOxygen();
        options.series[1].data = getHelium();
        options.series[2].data = getArgon();
    }
    chart.update(options);
}

function randomDelta(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function randomIndex(length: number) {
    return Math.round(Math.random() * (length - 1));
}

function randomiseData() {
    if (options.series !== undefined) {
        const fn = (datum: Datum): Datum => {
            const volumeDelta = randomDelta(-0.1, 0.1);
            const pressureDelta = randomDelta(-1, 1);
            return {
                volume: datum.volume + volumeDelta,
                volumeLower: datum.volumeLower + volumeDelta,
                volumeUpper: datum.volumeUpper + volumeDelta,
                pressure: datum.pressure + pressureDelta,
                pressureLower: datum.pressureLower + pressureDelta,
                pressureUpper: datum.pressureUpper + pressureDelta,
            };
        };
        options.series[0].data = options.series[0].data?.map(fn);
        options.series[1].data = options.series[1].data?.map(fn);
        options.series[2].data = options.series[2].data?.map(fn);
    }
    chart.update(options);
}

function randomiseErrors() {
    if (options.series !== undefined) {
        const fn = (datum: Datum): Datum => {
            return {
                volume: datum.volume,
                volumeLower: datum.volume - randomDelta(0.05, 0.1),
                volumeUpper: datum.volume + randomDelta(0.05, 0.1),
                pressure: datum.pressure,
                pressureLower: datum.pressure - randomDelta(0.5, 2),
                pressureUpper: datum.pressure + randomDelta(0.5, 2),
            };
        };
        options.series[0].data = options.series[0].data?.map(fn);
        options.series[1].data = options.series[1].data?.map(fn);
        options.series[2].data = options.series[2].data?.map(fn);
    }
    chart.update(options);
}

function removeRandomElem() {
    const { series } = options;
    if (series !== undefined) {
        const meta: { seriesIndex: number; datumIndex: number }[] = [];
        for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
            const { data } = series[seriesIndex];
            for (let datumIndex = 0; datumIndex < (data?.length ?? 0); datumIndex++) {
                meta.push({ seriesIndex, datumIndex });
            }
        }
        const { seriesIndex, datumIndex } = meta[randomIndex(meta.length)];
        series[seriesIndex].data?.splice(datumIndex, 1);
    }
    chart.update(options);
}
