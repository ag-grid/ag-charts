import { Canvas } from 'skia-canvas';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Group, LinearGradient, Logger, Pattern, Scene, TranslatableGroup } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { box, maxAlpha } from '../util/test/shadowPixels';

const WIDTH = 400;
const HEIGHT = 220;

// Solid red shadow, offset clear of the item, no blur: a `spread` makes the mask a silhouette of the alpha painted, and the alpha of a
// pixel inside the cast is the strength of the shadow.
const SHADOW = { enabled: true, fill: 'rgba(255, 0, 0, 1)', xOffset: 100, yOffset: 0, blur: 0, spread: 10 };
const SOFT = { enabled: true, fill: 'rgba(0, 0, 0, 0.5)', xOffset: 4, yOffset: 4, blur: 4 };

const BATCH_SHADOWS = { 'own cast': false, 'layer batch': true, root: 'shared' } as const;
type Route = keyof typeof BATCH_SHADOWS;

const ROUTES = Object.keys(BATCH_SHADOWS) as Route[];
const BATCHED_ROUTES: Route[] = ['layer batch', 'root'];

const ITEM = { x: 20, width: 40, height: 50, ys: [40, 130] } as const;

describe('Pattern paint and shadow mask', () => {
    setupMockCanvas({ width: WIDTH, height: HEIGHT });

    const scenes: Scene[] = [];

    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        for (const scene of scenes.splice(0)) scene.destroy();
        vi.restoreAllMocks();
    });

    /** The children in one group, drawn by a route: the shape's own cast, the layer batch of the group, or the shadow root. */
    const newScene = (route: Route, children: readonly Node[]) => {
        const layer = new Group({ name: 'g', batchShadows: BATCH_SHADOWS[route] });
        const root = new TranslatableGroup({ name: 'root', shadowRoot: route === 'root' });
        root.appendChild(layer);
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(WIDTH, HEIGHT, 1);
        scene.setRoot(root);
        scenes.push(scene);
        for (const child of children) layer.appendChild(child);
        return { scene, root };
    };

    const alphaIn = (scene: Scene, x: number, y: number, width: number, height: number) =>
        maxAlpha(scene.canvas.context.getImageData(x, y, width, height).data);

    /** The strongest alpha painted over the item, and the strongest cast at the centre of its shadow. */
    const painted = (scene: Scene, y: number) => alphaIn(scene, ITEM.x, y, ITEM.width, ITEM.height);
    const cast = (scene: Scene, y: number) =>
        alphaIn(scene, ITEM.x + ITEM.width / 2 + SHADOW.xOffset - 3, y + ITEM.height / 2 - 3, 6, 6);

    const items = (fill: object) =>
        ITEM.ys.map((y) => box(ITEM.x, y, ITEM.width, ITEM.height, { fill: fill as never, fillShadow: SHADOW }));

    describe('stroke: none', () => {
        const squares = (mixin: object) => ({
            type: 'pattern' as const,
            pattern: 'squares' as const,
            width: 10,
            height: 10,
            fill: 'black',
            fillOpacity: 0.2,
            backgroundFill: 'none',
            ...mixin,
        });

        it.each(ROUTES)('should paint no stroke and cast what is painted (%s)', (route) => {
            const { scene } = newScene(route, items(squares({ stroke: 'none' })));
            scene.render();

            // The fill is black at 0.2: a stroke painted in the context's default black would reach full alpha.
            for (const y of ITEM.ys) {
                expect(painted(scene, y)).toBeGreaterThan(0);
                expect(painted(scene, y)).toBeLessThanOrEqual(52);
                expect(cast(scene, y)).toBe(painted(scene, y));
            }
        });

        it('should still paint a coloured stroke', () => {
            const { scene } = newScene(
                'own cast',
                items(squares({ stroke: 'blue', strokeWidth: 2, strokeOpacity: 1 }))
            );
            scene.render();

            expect(painted(scene, ITEM.ys[0])).toBe(255);
        });
    });

    describe('pattern too small to draw', () => {
        // Half a pixel across: the pattern is not drawn, and the shape paints its plain fill (red at 0.2) instead.
        const tiny = (mixin: object) => ({
            type: 'pattern' as const,
            pattern: 'squares' as const,
            width: 1,
            height: 1,
            scale: 0.5,
            fill: 'red',
            fillOpacity: 0.2,
            strokeWidth: 0,
            ...mixin,
        });

        // The background counts for nothing once the tile is dropped, and the fill's own opacity must not be applied twice. The canvas
        // ignores `fillStyle = 'none'`, so a fallback that assigned it would paint the previous fill style.
        const CASES = [
            ['an opaque background', { backgroundFill: 'black', backgroundFillOpacity: 1 }, 51],
            ['a semi-transparent background', { backgroundFill: 'black', backgroundFillOpacity: 0.5 }, 51],
            ['no background', { backgroundFill: 'none' }, 51],
            ['an opaque fill', { fillOpacity: 1, backgroundFill: 'black', backgroundFillOpacity: 0.5 }, 255],
            ['a fill of none', { fill: 'none', backgroundFill: 'black', backgroundFillOpacity: 0.5 }, 0],
        ] as const;

        describe.each(ROUTES)('%s', (route) => {
            it.each(CASES)('should paint and cast the plain fill with %s', (_name, mixin, expected) => {
                const { scene } = newScene(route, items(tiny(mixin)));
                scene.render();

                for (const y of ITEM.ys) {
                    expect(Math.abs(painted(scene, y) - expected)).toBeLessThanOrEqual(1);
                    expect(Math.abs(cast(scene, y) - painted(scene, y))).toBeLessThanOrEqual(1);
                }
            });
        });

        it('should cast the alpha of the full pattern once it is large enough to draw', () => {
            // The pattern at scale 1: the background shows through the fill, so the cast follows the composite alpha.
            const fill = tiny({ width: 10, height: 10, scale: 1, backgroundFill: 'black', backgroundFillOpacity: 1 });
            const { scene } = newScene('own cast', items(fill));
            scene.render();

            expect(painted(scene, ITEM.ys[0])).toBe(255);
            expect(cast(scene, ITEM.ys[0])).toBe(255);
        });
    });

    describe('paint caches', () => {
        // A paint is built for a rect on its layer and again in the mask, so it is built once for each rect and context on the first
        // frame, and not again.
        const CASES = [
            {
                name: 'patterns',
                fill: { type: 'pattern' as const, pattern: 'squares' as const, fill: 'red', stroke: 'blue' },
                spyOnBuilds: () => vi.spyOn(Pattern.prototype as never, 'createCanvasPattern' as never),
            },
            {
                name: 'gradients',
                fill: { type: 'gradient' as const, colorStops: [{ color: 'red' }, { color: 'blue' }] },
                spyOnBuilds: () => vi.spyOn(LinearGradient.prototype as never, 'createCanvasGradient' as never),
            },
            {
                name: 'images',
                fill: { type: 'image' as const, url: 'pattern-paint.png' },
                // The only patterns made on a context are those of the images.
                spyOnBuilds: (scene: Scene) => {
                    vi.spyOn(scene.imageLoader, 'loadImage').mockReturnValue(new Canvas(8, 8) as never);
                    return vi.spyOn(Object.getPrototypeOf(scene.canvas.context), 'createPattern');
                },
            },
        ];

        /** Draws frames in which only an unrelated rect moves, so that no kept cast can be reused, and counts the builds in each. */
        const buildsPerFrame = (route: Route, { fill, spyOnBuilds }: (typeof CASES)[number]) => {
            const rects = Array.from({ length: 6 }, (_, i) => box(10 + 40 * i, 40, 20, 40, { fillShadow: SOFT }));
            const nudged = box(10, 190, 20, 20, { fill: 'green', fillShadow: SOFT });
            const { scene, root } = newScene(route, [...rects, nudged]);
            // An image fill finds its loader through the scene, so the fills are set once the rects are attached.
            const builds = spyOnBuilds(scene);
            for (const rect of rects) rect.fill = fill;

            scene.render();
            const first = builds.mock.calls.length;

            return {
                first,
                frames: [1, 2, 3].map((frame) => {
                    const before = builds.mock.calls.length;
                    nudged.x = 10 + frame;
                    root.markDirty();
                    scene.render();
                    return builds.mock.calls.length - before;
                }),
            };
        };

        describe.each(BATCHED_ROUTES)('%s', (route) => {
            it.each(CASES)('should not rebuild $name each frame', (paintCase) => {
                const { first, frames } = buildsPerFrame(route, paintCase);

                expect(first).toBeGreaterThan(0);
                expect(frames).toEqual([0, 0, 0]);
            });
        });

        it('should build a pattern once for each context and pixel ratio', () => {
            const pattern = new Pattern({ pattern: 'squares', fill: 'red' } as never);
            const logger = new Logger();
            const [ctxA, ctxB] = [new Canvas(10, 10).getContext('2d'), new Canvas(10, 10).getContext('2d')];
            const builds = [vi.spyOn(ctxA, 'createPattern'), vi.spyOn(ctxB, 'createPattern')];
            const create = (ctx: typeof ctxA, pixelRatio: number) =>
                pattern.createPattern(ctx as never, pixelRatio, logger);

            for (let i = 0; i < 3; i++) {
                create(ctxA, 1);
                create(ctxB, 1);
            }
            expect(builds.map((spy) => spy.mock.calls.length)).toEqual([1, 1]);

            create(ctxA, 2);
            create(ctxA, 2);
            expect(builds.map((spy) => spy.mock.calls.length)).toEqual([2, 1]);
        });
    });
});
