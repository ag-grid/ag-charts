import { afterEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '../logging/logger';
import { BBox } from './bbox';
import { LinearGradient } from './gradient/linearGradient';
import { Image } from './image/image';
import type { Node } from './node';
import { Pattern } from './pattern/pattern';

// A shadow mask and its layer paint the same fill in two contexts by turns. Each context keeps its own entry, so the paint is built
// once for each, and not on every switch.
describe('Paint caches', () => {
    const ctxA = {} as CanvasRenderingContext2D;
    const ctxB = {} as CanvasRenderingContext2D;
    const logger = new Logger();

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Pattern', () => {
        const setup = () => {
            const pattern = new Pattern({ pattern: 'squares', fill: 'red' } as never);
            const build = vi.spyOn(pattern as never, 'createCanvasPattern').mockImplementation(() => ({}));
            return { pattern, build };
        };

        it('should build once per context', () => {
            const { pattern, build } = setup();

            const a = pattern.createPattern(ctxA, 1, logger);
            const b = pattern.createPattern(ctxB, 1, logger);
            for (let i = 0; i < 3; i++) {
                expect(pattern.createPattern(ctxA, 1, logger)).toBe(a);
                expect(pattern.createPattern(ctxB, 1, logger)).toBe(b);
            }

            expect(a).not.toBe(b);
            expect(build).toHaveBeenCalledTimes(2);
        });

        it('should rebuild for a context when the pixel ratio changes', () => {
            const { pattern, build } = setup();

            pattern.createPattern(ctxA, 1, logger);
            pattern.createPattern(ctxA, 2, logger);
            pattern.createPattern(ctxA, 2, logger);

            expect(build).toHaveBeenCalledTimes(2);
        });
    });

    describe('Gradient', () => {
        const setup = () => {
            const gradient = new LinearGradient('rgb', [
                { stop: 0, color: 'red' },
                { stop: 1, color: 'blue' },
            ]);
            const build = vi
                .spyOn(gradient as never, 'createCanvasGradient')
                .mockImplementation(() => ({ addColorStop: () => {} }));
            return { gradient, build };
        };
        const bbox = new BBox(0, 0, 20, 40);

        it('should build once per context', () => {
            const { gradient, build } = setup();

            const a = gradient.createGradient(ctxA, bbox);
            const b = gradient.createGradient(ctxB, bbox);
            for (let i = 0; i < 3; i++) {
                expect(gradient.createGradient(ctxA, bbox)).toBe(a);
                expect(gradient.createGradient(ctxB, bbox)).toBe(b);
            }

            expect(a).not.toBe(b);
            expect(build).toHaveBeenCalledTimes(2);
        });

        it('should rebuild for a context when the bbox changes', () => {
            const { gradient, build } = setup();

            gradient.createGradient(ctxA, bbox);
            gradient.createGradient(ctxA, new BBox(5, 0, 20, 40));
            gradient.createGradient(ctxA, new BBox(5, 0, 20, 40));

            expect(build).toHaveBeenCalledTimes(2);
        });
    });

    describe('Image', () => {
        const node = {} as Node;
        const setup = () => {
            const image = new Image(undefined, { url: 'a.png' } as never);
            const build = vi.spyOn(image as never, 'createCanvasImage').mockImplementation(() => ({}));
            return { image, build };
        };

        it('should build once per context', () => {
            const { image, build } = setup();

            const a = image.createPattern(ctxA, 10, 10, node, logger);
            const b = image.createPattern(ctxB, 10, 10, node, logger);
            for (let i = 0; i < 3; i++) {
                expect(image.createPattern(ctxA, 10, 10, node, logger)).toBe(a);
                expect(image.createPattern(ctxB, 10, 10, node, logger)).toBe(b);
            }

            expect(a).not.toBe(b);
            expect(build).toHaveBeenCalledTimes(2);
        });

        it('should rebuild for a context when the size changes', () => {
            const { image, build } = setup();

            image.createPattern(ctxA, 10, 10, node, logger);
            image.createPattern(ctxA, 20, 10, node, logger);
            image.createPattern(ctxA, 20, 10, node, logger);

            expect(build).toHaveBeenCalledTimes(2);
        });
    });
});
