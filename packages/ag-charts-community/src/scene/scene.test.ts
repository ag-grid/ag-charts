import { describe, expect, it } from 'vitest';

import { Group, Logger, SHADOW_SHRINK_AFTER, Scene, ambientLogger } from 'ag-charts-core';
import type { RenderContext } from 'ag-charts-core';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { box, redHalfShadow } from '../util/test/shadowPixels';

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
    const canvasCtx = setupMockCanvas();

    describe('render-context logger', () => {
        it('passes the configured logger into the render context', () => {
            const logger = new Logger();
            expect(renderCapturingScene(1, logger)?.logger).toBe(logger);
        });

        it('shares the ambient logger when constructed without one (grid sparkline use)', () => {
            const first = renderCapturingScene(1)?.logger;
            expect(first).toBe(ambientLogger);
            // One `warnOnce` cache across every context-less Scene, so a grid of sparklines sharing
            // a bad config warns once rather than once per cell.
            expect(renderCapturingScene(1)?.logger).toBe(first);
        });
    });

    // At non-1 DPR the first Scene.resize callback can match the HdpiCanvas seeded defaults exactly,
    // so the equality short-circuit must not skip installing the DPR transform.
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

    describe('shadow scratch canvas', () => {
        // The scratch is the largest canvas that the render makes.
        const scratchArea = (before: Set<OffscreenCanvas>) =>
            Math.max(
                0,
                ...canvasCtx
                    .getActiveOffscreenCanvasInstances()
                    .filter((canvas) => !before.has(canvas) && canvas.width > 0)
                    .map((canvas) => canvas.width * canvas.height)
            );

        it('should shrink after the scene renders many frames that ask for a much smaller canvas', () => {
            const before = new Set(canvasCtx.getActiveOffscreenCanvasInstances());
            const canvasElement = document.createElement('canvas');
            const scene = new Scene({ canvasElement, pixelRatio: 1 });
            const root = new Group({ name: 'root' });
            root.batchShadows = true;
            const caster = box(20, 20, 40, 40);
            root.appendChild(caster);
            scene.setRoot(root);

            // The canvas is as large as the casters' silhouettes, so a large caster asks for a large one. The caster also
            // moves, as an animating one does, so that the scene keeps none of its shadows.
            const renderWithSize = (size: number) => {
                caster.x += 1;
                caster.width = size;
                caster.height = size;
                caster.fillShadow = redHalfShadow(0, 0);
                root.markDirty('test');
                scene.render();
            };

            renderWithSize(120);
            const large = scratchArea(before);
            expect(large).toBeGreaterThan(0);

            // A frame counts once the next one starts, so the 31st small frame is the first to see 30 of them.
            for (let i = 0; i < SHADOW_SHRINK_AFTER; i++) renderWithSize(10);
            expect(scratchArea(before)).toBe(large);

            renderWithSize(10);
            expect(scratchArea(before) * 4).toBeLessThan(large);

            scene.destroy();
        });
    });
});
