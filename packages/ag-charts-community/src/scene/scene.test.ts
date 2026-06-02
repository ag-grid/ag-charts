import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { Scene } from './scene';

describe('Scene', () => {
    setupMockCanvas();

    // AG-17372: at non-1 DPR, autoSize failed to fill a 600 px container because the first
    // Scene.resize callback matched the HdpiCanvas seeded defaults exactly and the equality
    // short-circuit fired before the DPR transform was installed.
    it('installs the DPR transform on the canvas context at construction', () => {
        const canvasElement = document.createElement('canvas');
        const scene = new Scene({ canvasElement, pixelRatio: 1.5 });

        expect(scene.canvas.element.width).toBe(900); // 600 * 1.5
        expect(scene.canvas.element.height).toBe(450); // 300 * 1.5
        expect(scene.canvas.element.style.width).toBe('600px');
        expect(scene.canvas.element.style.height).toBe('300px');

        const transform = scene.canvas.context.getTransform();
        expect(transform.a).toBe(1.5);
        expect(transform.d).toBe(1.5);
    });
});
