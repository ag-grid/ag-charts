import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { Scene } from './scene';

describe('Scene', () => {
    setupMockCanvas();

    // AG-17372: At non-1 DPR, autoSize failed to fill a container exactly 600 px wide. The
    // first sizeMonitor callback would arrive at (600, 300, DPR) — matching the HdpiCanvas
    // constructor seeds — so Scene.resize's equality check short-circuited and the DPR
    // setTransform never reached the canvas context. The fix installs the transform at
    // construction so the seed-matching short-circuit is safe.
    describe('AG-17372 — HdpiCanvas installs DPR transform at construction', () => {
        it('applies setTransform to the canvas context with the configured pixel ratio', () => {
            const canvasElement = document.createElement('canvas');
            const scene = new Scene({ canvasElement, pixelRatio: 1.5 });

            // The element-level backing-store size reflects the DPR-scaled seeded defaults.
            expect(scene.canvas.element.width).toBe(900); // 600 * 1.5
            expect(scene.canvas.element.height).toBe(450); // 300 * 1.5
            expect(scene.canvas.element.style.width).toBe('600px');
            expect(scene.canvas.element.style.height).toBe('300px');

            // Drawing at CSS-pixel coordinates should land in the DPR-scaled backing store —
            // verify by asking the context to map a unit point through its current transform.
            const ctx = scene.canvas.context;
            const transform = ctx.getTransform();
            expect(transform.a).toBe(1.5);
            expect(transform.d).toBe(1.5);
        });
    });
});
