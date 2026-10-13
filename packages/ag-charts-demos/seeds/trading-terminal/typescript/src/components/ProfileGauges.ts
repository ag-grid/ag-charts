import { type AgChartInstance, AgCharts } from 'ag-charts-community';
import { type AgGaugeColorStop, type AgGaugeOptions, type AgLinearGaugeOptions } from 'ag-charts-enterprise';

import { THEME } from '../chartTheme';
import { type GaugeMetrics } from '../data';
import { type View, h } from '../dom';

// Three-band (down/neutral/up) and five-band (analyst) discrete colour scales,
// pitched for the dark card surface so every band holds against near-black.
const THREE_STEP_SCALE = ['#F43F5E', '#71717A', '#10B981'];
const FIVE_STEP_SCALE = ['#E11D48', '#FB7185', '#71717A', '#34D399', '#059669'];

// Target marker ink — reads against the dark panel.
const TARGET_INK = '#e8e9ea';

const CONSENSUS_LABELS = ['Strong sell', 'Sell', 'Neutral', 'Buy', 'Strong buy'];
const consensusLabel = (rating: number) => CONSENSUS_LABELS[Math.min(4, Math.floor(rating / 20))];

// Prefix a signed value with '+' or '-', leaving zero unsigned.
function signPrefix(n: number): string {
    if (n > 0) return '+';
    if (n < 0) return '-';
    return '';
}

// Pick the discrete-band colour a value falls into, matching the gauge fills.
function bandColor(value: number, stops: number[], colors: string[]): string {
    const index = stops.findIndex((stop) => value < stop);
    return index === -1 ? colors[colors.length - 1] : colors[index];
}

// A horizontal linear gauge with discrete colour bands and a needle-style target.
function linearGauge(
    container: HTMLElement,
    value: number,
    max: number,
    fills: AgGaugeColorStop[],
    step: number,
    min = 0
): AgLinearGaugeOptions {
    return {
        container,
        theme: THEME,
        type: 'linear-gauge',
        direction: 'horizontal',
        value,
        thickness: 14,
        scale: {
            min,
            max,
            fillMode: 'discrete',
            fills,
            interval: { step },
            label: { spacing: 6 },
            fillOpacity: 0.7,
        },
        bar: {
            enabled: false,
        },
        segmentation: {
            enabled: true,
            spacing: 1,
        },
        targets: [
            { value, shape: 'line', placement: 'middle', size: 20, strokeWidth: 2, stroke: TARGET_INK },
            // A downward triangle above the line for extra emphasis of the target.
            {
                value,
                shape: 'triangle',
                placement: 'before',
                size: 12,
                rotation: 0,
                fill: TARGET_INK,
                stroke: TARGET_INK,
                spacing: 0,
            },
        ],
        padding: {
            right: 12,
            left: 12,
            bottom: 0,
            top: 0,
        },
    };
}

const sentimentGauge = (container: HTMLElement, sentiment: number) =>
    linearGauge(
        container,
        sentiment,
        100,
        [
            { color: THREE_STEP_SCALE[0], stop: 40 },
            { color: THREE_STEP_SCALE[1], stop: 60 },
            { color: THREE_STEP_SCALE[2] },
        ],
        20
    );

const betaGauge = (container: HTMLElement, beta: number) =>
    linearGauge(
        container,
        beta,
        2,
        [
            { color: THREE_STEP_SCALE[0], stop: -1 },
            { color: THREE_STEP_SCALE[1], stop: 1 },
            { color: THREE_STEP_SCALE[2] },
        ],
        1,
        -2
    );

const analystGauge = (container: HTMLElement, analystRating: number) =>
    linearGauge(
        container,
        analystRating,
        100,
        [
            { color: FIVE_STEP_SCALE[0], stop: 20 },
            { color: FIVE_STEP_SCALE[1], stop: 40 },
            { color: FIVE_STEP_SCALE[2], stop: 60 },
            { color: FIVE_STEP_SCALE[3], stop: 80 },
            { color: FIVE_STEP_SCALE[4] },
        ],
        20
    );

// eslint-disable-next-line no-console
const logError = (e: unknown) => console.error(e);

/** One gauge card: the title with its coloured value, and the gauge below. */
interface GaugeCard {
    el: HTMLDivElement;
    value: HTMLSpanElement;
    container: HTMLDivElement;
    chart?: AgChartInstance<AgGaugeOptions>;
}

function gaugeCard(title: string): GaugeCard {
    const value = h('span', { class: 'fin-value' });
    const container = h('div', { style: 'height: 100%; width: 100%;' });
    const el = h(
        'div',
        { class: 'fin-detail-card' },
        h('div', { class: 'fin-detail-card-title' }, title, value),
        h('div', { class: 'fin-detail-gauge' }, container)
    );
    return { el, value, container };
}

export interface ProfileGauges extends View {
    update(metrics: GaugeMetrics): void;
}

export function createProfileGauges(initial: GaugeMetrics): ProfileGauges {
    const sentiment = gaugeCard('News sentiment');
    const beta = gaugeCard('Beta vs S&P 500');
    const analyst = gaugeCard('Analyst recommendation');
    const el = h('div', { class: 'fin-detail-gauges' }, sentiment.el, beta.el, analyst.el);

    let metrics = initial;

    function renderTitles() {
        // Sentiment is the % of positive headlines; show whichever share dominates.
        const sentimentPositive = metrics.sentiment >= 50;
        const sentimentPct = sentimentPositive ? metrics.sentiment : 100 - metrics.sentiment;
        sentiment.value.textContent = `${sentimentPct}% ${sentimentPositive ? 'positive' : 'negative'}`;
        beta.value.textContent = `${signPrefix(metrics.beta)}${Math.abs(metrics.beta).toFixed(2)}`;
        analyst.value.textContent = consensusLabel(metrics.analystRating);

        // Colour each value to match the band it lands in on its gauge.
        sentiment.value.style.color = bandColor(metrics.sentiment, [40, 60], THREE_STEP_SCALE);
        beta.value.style.color = bandColor(metrics.beta, [-1, 1], THREE_STEP_SCALE);
        analyst.value.style.color = bandColor(metrics.analystRating, [20, 40, 60, 80], FIVE_STEP_SCALE);
    }
    renderTitles();

    return {
        el,
        mount() {
            sentiment.chart = AgCharts.createGauge(sentimentGauge(sentiment.container, metrics.sentiment));
            beta.chart = AgCharts.createGauge(betaGauge(beta.container, metrics.beta));
            analyst.chart = AgCharts.createGauge(analystGauge(analyst.container, metrics.analystRating));
        },
        update(next) {
            // A fresh metrics object arrives every tick, so skip the work unless a value actually moved
            // (the React component is memoised on these three values).
            const previous = metrics;
            if (
                previous.sentiment === next.sentiment &&
                previous.beta === next.beta &&
                previous.analystRating === next.analystRating
            ) {
                return;
            }
            metrics = next;
            renderTitles();
            // Each gauge's options are memoised on its own value, so only the moved ones update.
            if (next.sentiment !== previous.sentiment) {
                sentiment.chart?.update(sentimentGauge(sentiment.container, next.sentiment)).catch(logError);
            }
            if (next.beta !== previous.beta) {
                beta.chart?.update(betaGauge(beta.container, next.beta)).catch(logError);
            }
            if (next.analystRating !== previous.analystRating) {
                analyst.chart?.update(analystGauge(analyst.container, next.analystRating)).catch(logError);
            }
        },
        destroy() {
            for (const card of [sentiment, beta, analyst]) {
                card.chart?.destroy();
                card.chart = undefined;
            }
        },
    };
}
