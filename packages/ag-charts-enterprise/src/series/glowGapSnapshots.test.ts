import { describe, it } from 'vitest';

import { HARD_GLOW, ROOM, useGlowCharts } from 'ag-charts-community-test';

import { BOX_PLOT, OHLC_KEYS } from '../test/glowSeriesCases';
import { createEnterpriseChart } from '../test/utils';

// A glow of spread 8 with a gap of 5, on wicks 8 thick: a cut that ran half the wick past its end would leave a hole of 9.
const GAP_GLOW = { ...HARD_GLOW, fill: '#d0021b', spread: 8, gap: 5 };

// The y axis has room above and below the tallest wick, so that a glow past its end is not cut off by the series area.
const AXES = { y: { type: 'number', min: 0, max: 10, gridLine: { enabled: false } } };

describe('glow gap snapshots (enterprise series)', () => {
    const { create, snapshot } = useGlowCharts(createEnterpriseChart);

    it('renders the glow gap past the end of the butt-capped wicks of a candlestick', async () => {
        await create(
            [
                {
                    type: 'candlestick',
                    ...OHLC_KEYS,
                    item: { up: { wick: { strokeWidth: 8 } }, down: { wick: { strokeWidth: 8 } } },
                    glow: GAP_GLOW,
                },
            ],
            [{ x: 'Q1', open: 4, high: 8, low: 2, close: 6 }],
            { ...ROOM, axes: AXES }
        );
        await snapshot();
    });

    it('renders the glow gap past the end of the butt-capped whiskers of a box plot', async () => {
        await create(
            [
                {
                    type: 'box-plot',
                    xKey: 'x',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                    whisker: { strokeWidth: 8 },
                    glow: GAP_GLOW,
                },
            ],
            BOX_PLOT.slice(0, 1).map((datum) => ({ ...datum, min: 2, q1: 4, median: 5, q3: 6, max: 8 })),
            { ...ROOM, axes: AXES }
        );
        await snapshot();
    });
});
