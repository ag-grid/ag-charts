import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { Scene } from './scene';

describe('Scene', () => {
    setupMockCanvas();

    // AG-17372: At non-1 DPR, autoSize failed to fill a container exactly 600 px wide. The
    // first sizeMonitor callback would arrive at (600, 300, DPR) — which equals the
    // HdpiCanvas constructor seeds — so Scene.resize's equality check short-circuited and
    // the DPR transform was never installed on the canvas context.
    describe('AG-17372 — first resize at default 600 × 300 must propagate', () => {
        it('returns true and applies the transform on first resize to default dimensions at non-1 DPR', () => {
            const canvasElement = document.createElement('canvas');
            const scene = new Scene({ canvasElement, pixelRatio: 1.5 });

            // Simulate sizeMonitor reporting the actual container at the constructor defaults.
            const propagated = scene.resize(600, 300, 1.5);
            expect(propagated).toBe(true);

            // Render once to flush the pending resize through HdpiCanvas.resize, which is
            // what installs the DPR setTransform on the canvas context.
            scene.render({ debugSplitTimes: { start: 0 }, extraDebugStats: {} });

            expect(scene.canvas.element.width).toBe(900); // 600 * 1.5
            expect(scene.canvas.element.height).toBe(450); // 300 * 1.5
            expect(scene.canvas.element.style.width).toBe('600px');
            expect(scene.canvas.element.style.height).toBe('300px');
        });
    });
});
