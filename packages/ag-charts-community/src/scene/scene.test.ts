import { describe, expect, it } from 'vitest';

import { Logger } from 'ag-charts-core';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { Group } from './group';
import { type RenderContext } from './node';
import { Scene } from './scene';

class CapturingGroup extends Group {
    captured?: RenderContext;
    override render(renderCtx: RenderContext): void {
        this.captured = renderCtx;
    }
}

function renderCapturingScene(pixelRatio: number, logger?: Logger): RenderContext | undefined {
    const canvasElement = document.createElement('canvas');
    const scene = new Scene({ canvasElement, pixelRatio }, logger);
    const root = new CapturingGroup();
    scene.setRoot(root);
    root.markDirty('test');
    scene.render();
    return root.captured;
}

describe('Scene', () => {
    setupMockCanvas();

    describe('render-context logger', () => {
        it('passes the configured logger into the render context', () => {
            const logger = new Logger();
            expect(renderCapturingScene(1, logger)?.logger).toBe(logger);
        });

        it('supplies a self-owned logger when constructed without one (grid sparkline use)', () => {
            const first = renderCapturingScene(1)?.logger;
            expect(first).toBeInstanceOf(Logger);
            // Each context-less Scene owns its logger rather than sharing an ambient one.
            expect(renderCapturingScene(1)?.logger).not.toBe(first);
        });
    });

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
