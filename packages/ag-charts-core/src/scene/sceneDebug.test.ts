import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LayersManager } from './layersManager';
import {
    DebugSelectors,
    cleanupDebugStats,
    debugStats,
    getDebugStatsStateForTesting,
    registerDebugStatsConsumer,
} from './sceneDebug';
import { fake, setAgChartsDebug } from './test/sceneAccessors';

describe('sceneDebug stats lifecycle', () => {
    let restoreDebug: (() => void) | undefined;

    beforeEach(() => {
        vi.useFakeTimers();
        cleanupDebugStats(true);
    });

    afterEach(() => {
        cleanupDebugStats(true);
        restoreDebug?.();
        restoreDebug = undefined;
        vi.useRealTimers();
    });

    it('cleans up global stats accumulator when last consumer releases', () => {
        restoreDebug = setAgChartsDebug([DebugSelectors.SCENE_STATS]);

        const release = registerDebugStatsConsumer();
        expect(getDebugStatsStateForTesting().consumers).toBe(1);
        expect(getDebugStatsStateForTesting().active).toBe(false);

        const ctx = createMockContext();
        const start = performance.now();
        debugStats(fake<LayersManager>({ size: 0 }), { start, render: 1 }, ctx, undefined, {});

        expect(getDebugStatsStateForTesting().active).toBe(true);

        release();

        expect(getDebugStatsStateForTesting().consumers).toBe(0);
        expect(getDebugStatsStateForTesting().active).toBe(false);
    });
});

function createMockContext(): CanvasRenderingContext2D {
    const measureText: CanvasRenderingContext2D['measureText'] = () => ({
        width: 10,
        actualBoundingBoxAscent: 5,
        actualBoundingBoxDescent: 5,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: 10,
        emHeightAscent: 5,
        emHeightDescent: 5,
        alphabeticBaseline: 0,
        fontBoundingBoxAscent: 5,
        fontBoundingBoxDescent: 5,
        hangingBaseline: 0,
        ideographicBaseline: 0,
    });

    let fillStyleValue = '';
    let textBaselineValue: CanvasTextBaseline = 'alphabetic';

    const ctx: Partial<CanvasRenderingContext2D> = {
        measureText,
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
    };

    Object.defineProperty(ctx, 'fillStyle', {
        get: () => fillStyleValue,
        set: (value: string) => {
            fillStyleValue = value;
        },
    });

    Object.defineProperty(ctx, 'textBaseline', {
        get: () => textBaselineValue,
        set: (value: CanvasTextBaseline) => {
            textBaselineValue = value;
        },
    });

    return ctx as CanvasRenderingContext2D;
}
