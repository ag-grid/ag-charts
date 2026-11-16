import { describe, expect, it } from 'vitest';

import { TWO_BAR_SERIES_OPTIONS, UNHIGHLIGHTED_SERIES, expectFade, setupHighlightFade } from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

describe('Transition animations', () => {
    const { frames, proxy, chart, datum, shown, highlight, capture, create } =
        setupHighlightFade(createEnterpriseChart);

    it('fades a highlight when animation is disabled', async () => {
        await create({ ...TWO_BAR_SERIES_OPTIONS, animation: { enabled: false } });

        highlight(datum(0, 1));
        const trajectory = await capture(() => shown(1, 0), 300);

        expectFade(trajectory, 1, UNHIGHLIGHTED_SERIES);
    });

    it('scales the fade with the animation duration', async () => {
        await create({ ...TWO_BAR_SERIES_OPTIONS, animation: { duration: 2000 } });

        // 0.3 of 2s: still fading after 400ms, done by 700ms.
        highlight(datum(0, 1));
        const trajectory = await capture(() => shown(1, 0), 300);
        expect(trajectory.at(-1)).toBeGreaterThan(UNHIGHLIGHTED_SERIES);

        await frames.captureAnimationFrames(proxy(), () => undefined, { frames: 3, duration: 300 });
        await chart().waitForUpdate();
        expect(shown(1, 0)).toBe(UNHIGHLIGHTED_SERIES);
    });
});
