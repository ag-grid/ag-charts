import { AgCharts, AgFinancialChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { Candle, MS_PER_DAY, PriceSimulator, getHistoricalData } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const CANDLE_INTERVAL_MS = 2000;
const TICKS_PER_CANDLE = 100;
const INITIAL_POINTS = 365;
const VISIBLE_POINTS = 25;

const data: Candle[] = getHistoricalData(INITIAL_POINTS);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'High-Frequency Update' },
    data,
    dateKey: 'timestamp',
    volume: true,
    navigator: false,
    rangeButtons: false,
    statusBar: true,
    toolbar: false,
    zoom: true,
    initialState: {
        zoom: {
            ratioX: { start: 1 - VISIBLE_POINTS / data.length, end: 1 },
        },
    },
};

const chart = AgCharts.createFinancialChart(options);

let currentCandle: Candle | undefined;
let simulator: PriceSimulator | undefined;
let candleIntervalId: ReturnType<typeof setInterval> | undefined;
let animationFrameId: number | undefined;
let isRunning = false;

/** inScope */
function startNewCandle() {
    const lastCandle = data[data.length - 1];
    const newTimestamp = lastCandle.timestamp + MS_PER_DAY;
    const openPrice = lastCandle.close;

    simulator = new PriceSimulator(openPrice, TICKS_PER_CANDLE);

    currentCandle = {
        timestamp: newTimestamp,
        open: openPrice,
        high: openPrice,
        low: openPrice,
        close: openPrice,
        volume: Math.round(1000000 + Math.random() * 500000),
    };

    data.push(currentCandle);
    chart.applyTransaction({ add: [currentCandle] });
}

/** inScope */
function processTick() {
    if (!currentCandle || !simulator) return;

    const newPrice = simulator.tick();
    currentCandle.close = newPrice;
    currentCandle.high = Math.max(currentCandle.high, newPrice);
    currentCandle.low = Math.min(currentCandle.low, newPrice);

    chart.applyTransaction({ update: [currentCandle] });
}

/** inScope */
function scheduleNextTick() {
    if (isRunning) {
        animationFrameId = requestAnimationFrame(() => {
            processTick();
            scheduleNextTick();
        });
    }
}

/** inScope */
function stopAllUpdates() {
    if (candleIntervalId) {
        clearInterval(candleIntervalId);
        candleIntervalId = undefined;
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = undefined;
    }
}

/** inScope */
function updateButton() {
    const button = document.getElementById('toggleBtn');
    if (button) {
        button.textContent = isRunning ? 'Stop' : 'Start';
    }
}

function toggleUpdates() {
    if (isRunning) {
        isRunning = false;
        stopAllUpdates();
    } else {
        isRunning = true;
        startNewCandle();
        scheduleNextTick();
        candleIntervalId = setInterval(() => startNewCandle(), CANDLE_INTERVAL_MS);
    }
    updateButton();
}
