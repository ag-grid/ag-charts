import { memo, useMemo } from 'react';

import { type AgGaugeColorStop, type AgLinearGaugeOptions } from 'ag-charts-enterprise';
import { AgGauge } from 'ag-charts-react';

import { THEME } from '../chartTheme';
import { type GaugeMetrics } from '../data';

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
    value: number,
    max: number,
    fills: AgGaugeColorStop[],
    step: number,
    min = 0
): AgLinearGaugeOptions {
    return {
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

interface ProfileGaugesProps {
    metrics: GaugeMetrics;
}

function ProfileGaugesImpl({ metrics }: ProfileGaugesProps) {
    const { sentiment, beta, analystRating } = metrics;

    const sentimentOptions = useMemo(
        () =>
            linearGauge(
                sentiment,
                100,
                [
                    { color: THREE_STEP_SCALE[0], stop: 40 },
                    { color: THREE_STEP_SCALE[1], stop: 60 },
                    { color: THREE_STEP_SCALE[2] },
                ],
                20
            ),
        [sentiment]
    );

    const betaOptions = useMemo(
        () =>
            linearGauge(
                beta,
                2,
                [
                    { color: THREE_STEP_SCALE[0], stop: -1 },
                    { color: THREE_STEP_SCALE[1], stop: 1 },
                    { color: THREE_STEP_SCALE[2] },
                ],
                1,
                -2
            ),
        [beta]
    );

    const analystOptions = useMemo(
        () =>
            linearGauge(
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
            ),
        [analystRating]
    );

    // Sentiment is the % of positive headlines; show whichever share dominates.
    const sentimentPositive = sentiment >= 50;
    const sentimentPct = sentimentPositive ? sentiment : 100 - sentiment;

    // Colour each value to match the band it lands in on its gauge.
    const sentimentColor = bandColor(sentiment, [40, 60], THREE_STEP_SCALE);
    const betaColor = bandColor(beta, [-1, 1], THREE_STEP_SCALE);
    const analystColor = bandColor(analystRating, [20, 40, 60, 80], FIVE_STEP_SCALE);

    return (
        <div className="fin-detail-gauges">
            <div className="fin-detail-card">
                <div className="fin-detail-card-title">
                    News sentiment
                    <span className="fin-value" style={{ color: sentimentColor }}>
                        {sentimentPct}% {sentimentPositive ? 'positive' : 'negative'}
                    </span>
                </div>
                <div className="fin-detail-gauge">
                    <AgGauge options={sentimentOptions} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>

            <div className="fin-detail-card">
                <div className="fin-detail-card-title">
                    Beta vs S&amp;P 500
                    <span className="fin-value" style={{ color: betaColor }}>
                        {signPrefix(beta)}
                        {Math.abs(beta).toFixed(2)}
                    </span>
                </div>
                <div className="fin-detail-gauge">
                    <AgGauge options={betaOptions} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>

            <div className="fin-detail-card">
                <div className="fin-detail-card-title">
                    Analyst recommendation
                    <span className="fin-value" style={{ color: analystColor }}>
                        {consensusLabel(analystRating)}
                    </span>
                </div>
                <div className="fin-detail-gauge">
                    <AgGauge options={analystOptions} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>
        </div>
    );
}

// A fresh metrics object arrives every tick, so skip the re-render unless a value actually moved.
export const ProfileGauges = memo(
    ProfileGaugesImpl,
    (prev, next) =>
        prev.metrics.sentiment === next.metrics.sentiment &&
        prev.metrics.beta === next.metrics.beta &&
        prev.metrics.analystRating === next.metrics.analystRating
);
