import {
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgCharts,
    AreaSeriesModule,
    BarSeriesModule,
    CandlestickSeriesModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    OhlcSeriesModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    TimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { Datum, SeriesType, createSeedData, generateNextDatum } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    BarSeriesModule,
    CandlestickSeriesModule,
    LineSeriesModule,
    NumberAxisModule,
    OhlcSeriesModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    TimeAxisModule,
    ZoomModule,
]);

let initialPoints = 1000;
let batchSize = 10;

let currentSeriesType: SeriesType = 'line';
let currentUpdateMode: 'rolling' | 'append' = 'rolling';

const seedResult = createSeedData(initialPoints, currentSeriesType);
let data: Datum[] = seedResult.data;
let nextIndex = data.length;
let lastBasePrice: number | undefined = seedResult.lastBasePrice;

function createSeriesConfig(seriesType: SeriesType): AgCartesianSeriesOptions[] {
    switch (seriesType) {
        case 'ohlc':
        case 'candlestick':
            return [
                {
                    type: seriesType,
                    xKey: 'timestamp',
                    openKey: 'open',
                    highKey: 'high',
                    lowKey: 'low',
                    closeKey: 'close',
                },
            ];
        case 'stacked-bar':
            return [
                { type: 'bar', xKey: 'timestamp', yKey: 'value', stacked: true },
                { type: 'bar', xKey: 'timestamp', yKey: 'value2', stacked: true },
            ];
        case 'stacked-area':
            return [
                { type: 'area', xKey: 'timestamp', yKey: 'value', stacked: true, marker: { enabled: false } },
                { type: 'area', xKey: 'timestamp', yKey: 'value2', stacked: true, marker: { enabled: false } },
            ];
        case 'range-area':
            return [
                {
                    type: 'range-area',
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ];
        case 'range-bar':
            return [
                {
                    type: 'range-bar',
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ];
        case 'area':
            return [
                {
                    type: 'area',
                    xKey: 'timestamp',
                    yKey: 'value',
                    marker: { enabled: false },
                    strokeWidth: 1,
                },
            ];
        case 'bar':
            return [
                {
                    type: 'bar',
                    xKey: 'timestamp',
                    yKey: 'value',
                },
            ];
        case 'line':
        default:
            return [
                {
                    type: 'line',
                    xKey: 'timestamp',
                    yKey: 'value',
                    marker: { enabled: false },
                    strokeWidth: 1,
                },
            ];
    }
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: { text: 'High-Frequency Data Updates' },
    subtitle: { text: 'Rolling Window: removing old points, adding new points' },
    animation: { enabled: false },
    zoom: { enabled: true, onDataChange: { strategy: 'preserveRatios' } },
    axes: {
        x: {
            type: 'time',
            position: 'bottom',
            nice: false,
            label: {
                format: '%H:%M:%S',
            },
        },
    },
    series: createSeriesConfig(currentSeriesType),
    legend: { enabled: false },
};

const chart = AgCharts.create(options);

let isRunning = false;
let animationFrameId: number | undefined;

/** inScope */
function runUpdate() {
    if (!isRunning) return;

    switch (currentUpdateMode) {
        case 'rolling':
            performRollingUpdate();
            break;
        case 'append':
            performAppendUpdate();
            break;
    }

    animationFrameId = requestAnimationFrame(runUpdate);
}

/** inScope */
function performRollingUpdate() {
    const newPoints: Datum[] = [];
    for (let i = 0; i < batchSize; i++) {
        const result = generateNextDatum(nextIndex++, currentSeriesType, lastBasePrice);
        newPoints.push(result.datum);
        lastBasePrice = result.lastBasePrice;
    }

    const pointsToRemove = data.slice(0, batchSize);
    chart.applyTransaction({
        remove: pointsToRemove,
        add: newPoints,
    });

    data.splice(0, batchSize);
    data.push(...newPoints);
}

/** inScope */
function performAppendUpdate() {
    const newPoints: Datum[] = [];
    for (let i = 0; i < batchSize; i++) {
        const result = generateNextDatum(nextIndex++, currentSeriesType, lastBasePrice);
        newPoints.push(result.datum);
        lastBasePrice = result.lastBasePrice;
    }

    chart.applyTransaction({
        add: newPoints,
    });

    data.push(...newPoints);
}

/** inScope */
function startUpdates() {
    if (isRunning) return;
    isRunning = true;
    updateButton();
    animationFrameId = requestAnimationFrame(runUpdate);
}

/** inScope */
function stopUpdates() {
    if (!isRunning) return;
    isRunning = false;
    updateButton();
    if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = undefined;
    }
}

function toggleUpdates() {
    if (isRunning) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

/** inScope */
function updateButton() {
    const button = document.getElementById('toggleBtn');
    if (button) {
        button.textContent = isRunning ? 'Stop Updates' : 'Start Updates';
    }
}

function updateSeriesType(value: string) {
    const wasRunning = isRunning;
    if (wasRunning) stopUpdates();

    currentSeriesType = value as SeriesType;

    const seedResult = createSeedData(initialPoints, currentSeriesType);
    data = seedResult.data;
    nextIndex = data.length;
    lastBasePrice = seedResult.lastBasePrice;

    options.data = data;
    options.series = createSeriesConfig(currentSeriesType);
    chart.update(options);

    if (wasRunning) startUpdates();
}

function updateMode(value: string) {
    const wasRunning = isRunning;
    if (wasRunning) stopUpdates();

    currentUpdateMode = value as 'rolling' | 'append';

    const subtitleText =
        currentUpdateMode === 'rolling'
            ? 'Rolling Window: removing old points, adding new points'
            : 'Append Only: continuously adding new points';
    options.subtitle = { text: subtitleText };

    const seedResult = createSeedData(initialPoints, currentSeriesType);
    data = seedResult.data;
    nextIndex = data.length;
    lastBasePrice = seedResult.lastBasePrice;

    options.data = data;
    chart.update(options);

    if (wasRunning) startUpdates();
}

function updateBatchSize(value: string) {
    batchSize = parseInt(value, 10);
}

function updateDataSize(value: string) {
    const wasRunning = isRunning;
    if (wasRunning) stopUpdates();

    initialPoints = parseInt(value, 10);

    const seedResult = createSeedData(initialPoints, currentSeriesType);
    data = seedResult.data;
    nextIndex = data.length;
    lastBasePrice = seedResult.lastBasePrice;

    options.data = data;
    chart.update(options);

    if (wasRunning) startUpdates();
}
