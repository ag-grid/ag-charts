import { Canvas } from 'skia-canvas';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Group, Pattern, Rect, Scene, TranslatableGroup } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { box } from '../util/test/shadowPixels';

const WIDTH = 400;
const HEIGHT = 220;

// Solid red shadow, offset clear of the item, no blur: a `spread` makes the mask a silhouette of the alpha painted, and the alpha of a
// pixel inside the cast is the strength of the shadow.
const SHADOW = { enabled: true, fill: 'rgba(255, 0, 0, 1)', xOffset: 100, yOffset: 0, blur: 0, spread: 10 };
const SHADOW_OFFSET = 100;

type Route = 'own cast' | 'layer batch' | 'root';

const ROUTES: readonly Route[] = ['own cast', 'layer batch', 'root'];

const ITEM = { x: 20, width: 40, height: 50, ys: [40, 130] } as const;

describe('Pattern paint in the shadow mask', () => {
    setupMockCanvas({ width: WIDTH, height: HEIGHT });

    const scenes: Scene[] = [];

    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        for (const scene of scenes.splice(0)) scene.destroy();
        vi.restoreAllMocks();
    });

    const BATCH_SHADOWS = { 'own cast': false, 'layer batch': true, root: 'shared' } as const;

    const group = (route: Route, children: readonly Node[]) => {
        const node = new Group({ name: 'g', batchShadows: BATCH_SHADOWS[route] });
        for (const child of children) node.appendChild(child);
        return node;
    };

    const newScene = (route: Route, children: readonly Node[]) => {
        const root = new TranslatableGroup({ name: 'root', shadowRoot: route === 'root' });
        root.appendChild(group(route, children));
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(WIDTH, HEIGHT, 1);
        scene.setRoot(root);
        scenes.push(scene);
        return { scene, root };
    };

    const data = (scene: Scene, x: number, y: number, width: number, height: number) =>
        scene.canvas.context.getImageData(x, y, width, height).data as ArrayLike<number>;

    const maxAlpha = (scene: Scene, x: number, y: number, width: number, height: number) => {
        const pixels = data(scene, x, y, width, height);
        let max = 0;
        for (let i = 3; i < pixels.length; i += 4) max = Math.max(max, pixels[i]);
        return max;
    };

    /** The strongest alpha painted over the item, and the strongest cast at the centre of its shadow. */
    const painted = (scene: Scene, y: number) => maxAlpha(scene, ITEM.x, y, ITEM.width, ITEM.height);
    const cast = (scene: Scene, y: number) =>
        maxAlpha(scene, ITEM.x + ITEM.width / 2 + SHADOW_OFFSET - 3, y + ITEM.height / 2 - 3, 6, 6);

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
        const FILL_ALPHA = 51;

        it.each(ROUTES)('should cast the alpha of the plain fill under an opaque background (%s)', (route) => {
            const { scene } = newScene(route, items(tiny({ backgroundFill: 'black', backgroundFillOpacity: 1 })));
            scene.render();

            for (const y of ITEM.ys) {
                expect(Math.abs(painted(scene, y) - FILL_ALPHA)).toBeLessThanOrEqual(1);
                expect(Math.abs(cast(scene, y) - painted(scene, y))).toBeLessThanOrEqual(1);
            }
        });

        // The background counts for nothing once the tile is dropped, and the fill's own opacity must not be applied twice.
        it.each(ROUTES)('should cast the alpha of the plain fill under a semi-transparent background (%s)', (route) => {
            const { scene } = newScene(route, items(tiny({ backgroundFill: 'black', backgroundFillOpacity: 0.5 })));
            scene.render();

            for (const y of ITEM.ys) {
                expect(Math.abs(painted(scene, y) - FILL_ALPHA)).toBeLessThanOrEqual(1);
                expect(Math.abs(cast(scene, y) - painted(scene, y))).toBeLessThanOrEqual(1);
            }
        });

        it.each(ROUTES)('should cast the alpha of the plain fill with no background (%s)', (route) => {
            const { scene } = newScene(route, items(tiny({ backgroundFill: 'none' })));
            scene.render();

            for (const y of ITEM.ys) {
                expect(Math.abs(painted(scene, y) - FILL_ALPHA)).toBeLessThanOrEqual(1);
                expect(Math.abs(cast(scene, y) - painted(scene, y))).toBeLessThanOrEqual(1);
            }
        });

        it.each(ROUTES)('should cast the alpha of an opaque plain fill (%s)', (route) => {
            const { scene } = newScene(
                route,
                items(tiny({ fillOpacity: 1, backgroundFill: 'black', backgroundFillOpacity: 0.5 }))
            );
            scene.render();

            for (const y of ITEM.ys) {
                expect(painted(scene, y)).toBe(255);
                expect(cast(scene, y)).toBe(255);
            }
        });

        it.each(ROUTES)('should paint and cast nothing for a plain fill of none (%s)', (route) => {
            // The canvas ignores `fillStyle = 'none'`, so a fallback that assigned it would paint the previous fill style.
            const { scene } = newScene(
                route,
                items(tiny({ fill: 'none', backgroundFill: 'black', backgroundFillOpacity: 0.5 }))
            );
            scene.render();

            for (const y of ITEM.ys) {
                expect(painted(scene, y)).toBe(0);
                expect(cast(scene, y)).toBe(0);
            }
        });

        it('should cast the alpha of the full pattern once it is large enough to draw', () => {
            // The pattern at scale 1: the background shows through the fill, so the cast follows the composite alpha.
            const { scene } = newScene(
                'own cast',
                items(tiny({ width: 10, height: 10, scale: 1, backgroundFill: 'black', backgroundFillOpacity: 1 }))
            );
            scene.render();

            expect(painted(scene, ITEM.ys[0])).toBe(255);
            expect(cast(scene, ITEM.ys[0])).toBe(255);
        });
    });
});

type Counter = ReturnType<typeof vi.spyOn>;

describe('Paint caches with a shadow mask', () => {
    setupMockCanvas({ width: WIDTH, height: HEIGHT });

    const scenes: Scene[] = [];

    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        for (const scene of scenes.splice(0)) scene.destroy();
        vi.restoreAllMocks();
    });

    const SOFT = { enabled: true, fill: 'rgba(0, 0, 0, 0.5)', xOffset: 4, yOffset: 4, blur: 4 };

    const patternFill = {
        type: 'pattern' as const,
        pattern: 'squares' as const,
        fill: 'red',
        stroke: 'blue',
        strokeWidth: 1,
    };
    const gradientFill = { type: 'gradient' as const, colorStops: [{ color: 'red' }, { color: 'blue' }] };
    const imageFill = { type: 'image' as const, url: 'pattern-paint.png' };

    const ROUTES_BATCHED = [
        ['layer batch', true, false],
        ['root', 'shared', true],
    ] as const;

    const row = (fill: object | string, y: number): Rect[] =>
        Array.from({ length: 6 }, (_, i) => box(10 + i * 40, y, 20, 40, { fill: fill as never, fillShadow: SOFT }));

    /** Renders frames in which only an unrelated rect moves, so that no kept cast can be reused, and counts the builds per frame. */
    const rebuildsPerFrame = (
        build: (scene: Scene) => { counters: Counter[]; nodes: Node[]; afterAttach?: () => void },
        batchShadows: boolean | 'shared',
        shadowRoot: boolean
    ) => {
        const root = new TranslatableGroup({ name: 'root', shadowRoot });
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(WIDTH, HEIGHT, 1);
        scene.setRoot(root);
        scenes.push(scene);

        const layer = new Group({ name: 'g', batchShadows });
        root.appendChild(layer);
        const { counters, nodes, afterAttach } = build(scene);
        const nudged = box(10, 190, 20, 20, { fill: 'green', fillShadow: SOFT });
        for (const node of [...nodes, nudged]) layer.appendChild(node);
        afterAttach?.();

        scene.render();
        const first = counters.map((counter) => counter.mock.calls.length);

        const frames: number[][] = [];
        for (let frame = 1; frame <= 3; frame++) {
            const before = counters.map((counter) => counter.mock.calls.length);
            nudged.x = 10 + frame;
            root.markDirty();
            scene.render();
            frames.push(counters.map((counter, i) => counter.mock.calls.length - before[i]));
        }
        return { first, frames };
    };

    const countPatternBuilds = () => vi.spyOn(Pattern.prototype as never, 'createCanvasPattern' as never);

    it.each(ROUTES_BATCHED)('should not rebuild patterns each frame (%s)', (_route, batchShadows, shadowRoot) => {
        const { first, frames } = rebuildsPerFrame(
            () => {
                const nodes = row(patternFill, 40);
                return { counters: [countPatternBuilds()], nodes };
            },
            batchShadows,
            shadowRoot
        );

        // Every rect paints the pattern on its layer and again in the mask: one build per context, as they share the pattern.
        expect(first[0]).toBeGreaterThan(0);
        expect(frames).toEqual([[0], [0], [0]]);
    });

    it.each(ROUTES_BATCHED)('should not rebuild gradients each frame (%s)', (_route, batchShadows, shadowRoot) => {
        const { first, frames } = rebuildsPerFrame(
            () => {
                const nodes = row(gradientFill, 100);
                const [sample] = nodes as unknown as { fillGradient: object }[];
                const spy = vi.spyOn(Object.getPrototypeOf(sample.fillGradient), 'createCanvasGradient');
                return { counters: [spy], nodes };
            },
            batchShadows,
            shadowRoot
        );

        expect(first[0]).toBeGreaterThan(0);
        expect(frames).toEqual([[0], [0], [0]]);
    });

    it.each(ROUTES_BATCHED)('should not rebuild image patterns each frame (%s)', (_route, batchShadows, shadowRoot) => {
        const { first, frames } = rebuildsPerFrame(
            (scene) => {
                // A small canvas stands in for a loaded image.
                const image = new Canvas(8, 8);
                vi.spyOn(scene.imageLoader, 'loadImage').mockReturnValue(image as unknown as HTMLImageElement);
                // An image fill finds its loader through the scene, so the fill is set once the rects are attached.
                const nodes = row('black', 150);
                const [sample] = row(imageFill, 150) as unknown as { fillImage: object }[];
                const spy = vi.spyOn(Object.getPrototypeOf(sample.fillImage), 'createCanvasImage');
                const afterAttach = () => {
                    for (const node of nodes) node.fill = imageFill;
                };
                return { counters: [spy], nodes, afterAttach };
            },
            batchShadows,
            shadowRoot
        );

        expect(first[0]).toBeGreaterThan(0);
        expect(frames).toEqual([[0], [0], [0]]);
    });

    it('should paint a pattern in the mask and on its layer without rebuilding it', () => {
        const nodes = row(patternFill, 40);
        const spy = countPatternBuilds();
        const root = new TranslatableGroup({ name: 'root', shadowRoot: false });
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(WIDTH, HEIGHT, 1);
        scene.setRoot(root);
        scenes.push(scene);
        const layer = new Group({ name: 'g', batchShadows: true });
        root.appendChild(layer);
        for (const node of nodes) layer.appendChild(node);

        scene.render();
        const afterFirst = spy.mock.calls.length;

        for (let frame = 0; frame < 3; frame++) {
            root.markDirty();
            scene.render();
        }

        expect(spy.mock.calls.length).toBe(afterFirst);
    });
});
