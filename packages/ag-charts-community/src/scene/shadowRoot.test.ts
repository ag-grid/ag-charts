import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Group, Rect, Scene, SegmentedGroup, TranslatableGroup, shadowPass } from 'ag-charts-core';
import type { Node, RenderContext } from 'ag-charts-core';

import { expectSamePixels } from '../chart/test/expectSamePixels';
import { setupMockCanvas } from '../util/test/mockCanvas';
import { BLACK, type Pixel, box, isHalfRed, redHalfShadow } from '../util/test/shadowPixels';

const WIDTH = 400;
const HEIGHT = 220;

const RED_HALF = redHalfShadow(60);
const UNUSABLE = { ...RED_HALF, blur: Number.NaN };

const square = (x: number, y: number, mixin: Partial<Rect> = {}) => box(x, y, 60, 60, mixin);

const group = (batchShadows: Group['batchShadows'], children: readonly Node[], mixin: Partial<Group> = {}) => {
    const node = new Group({ name: 'shared-group', batchShadows });
    Object.assign(node, mixin);
    for (const child of children) node.appendChild(child);
    return node;
};

const segmentedGroup = (children: readonly Node[], segments: SegmentedGroup['segments']) => {
    const node = new SegmentedGroup({ name: 'segmented-group', batchShadows: 'shared' });
    node.segments = segments;
    for (const child of children) node.appendChild(child);
    return node;
};

const segment = (x0: number, x1: number) => ({
    clipRect: { x0, y0: 0, x1, y1: HEIGHT },
    fill: 'green',
    fillOpacity: 1,
    stroke: 'green',
    strokeOpacity: 1,
    strokeWidth: 1,
});

describe('Shadow root', () => {
    const canvasCtx = setupMockCanvas({ width: WIDTH, height: HEIGHT });

    const scenes: Scene[] = [];
    let masked: number[] = [];

    class TestRect extends Rect {
        override isolatedRender(renderCtx: RenderContext) {
            if (shadowPass.state === 'mask') masked.push(this.x);
            return super.isolatedRender(renderCtx);
        }
    }

    beforeEach(() => {
        masked = [];
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        for (const scene of scenes.splice(0)) scene.destroy();
        vi.mocked(console.warn).mockRestore();
    });

    const newScene = (root: Group) => {
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(WIDTH, HEIGHT, 1);
        scene.setRoot(root);
        scenes.push(scene);
        return scene;
    };

    const pixelsOf = (scene: Scene) =>
        Array.from(scene.canvas.context.getImageData(0, 0, WIDTH, HEIGHT).data as ArrayLike<number>);

    const at = (scene: Scene, x: number, y: number): Pixel =>
        Array.from(scene.canvas.context.getImageData(x, y, 1, 1).data as ArrayLike<number>);

    // The same tree drawn by a root, or by the groups themselves when `shadowRoot` is off.
    const draw = (shadowRoot: boolean, build: () => Group[]) => {
        const root = new TranslatableGroup({ name: 'root', shadowRoot });
        for (const child of build()) root.appendChild(child);
        const scene = newScene(root);
        scene.render();
        return scene;
    };

    // The root rounds the alpha of a shadow another way than the batch of a group, so a byte may differ by one.
    const expectNearPixels = (actual: number[], expected: number[]) =>
        expectSamePixels({ data: actual }, { data: expected }, 1);

    const expectSameAsLocal = (build: () => Group[]) => {
        const local = pixelsOf(draw(false, build));
        expect(local.some((value) => value !== 0)).toBe(true);
        expectNearPixels(pixelsOf(draw(true, build)), local);
    };

    const inUse = (before: Set<OffscreenCanvas>) =>
        canvasCtx.getActiveOffscreenCanvasInstances().filter((canvas) => !before.has(canvas) && canvas.width > 0);

    describe('ordering', () => {
        // The shadow of the second box lands on the first, which is to its right.
        const series = () => [
            group('shared', [square(120, 40, { fillShadow: RED_HALF })], { zIndex: 1 }),
            group('shared', [square(40, 40, { fillShadow: RED_HALF })], { zIndex: 2 }),
        ];

        it('should draw the shadow of a later group beneath the items of an earlier group', () => {
            const scene = draw(true, series);

            expect(at(scene, 130, 70)).toEqual(BLACK);
            expect(isHalfRed(at(scene, 105, 70))).toBe(true);
        });

        it('should draw the shadow of a later group over the items of an earlier group without a root', () => {
            const scene = draw(false, series);

            expect(at(scene, 130, 70)).not.toEqual(BLACK);
        });

        it('should cast the shadows of groups that share them once, where they are adjacent or not', () => {
            const casters = [
                group('shared', [new TestRect()]),
                group('shared', [new TestRect()]),
                group('shared', [new TestRect()]),
            ];
            for (const [i, node] of casters.entries()) {
                const rect = [...node.children()][0] as TestRect;
                Object.assign(rect, { x: 20 + i * 100, y: 40, width: 40, height: 40, fill: 'black' });
                rect.fillShadow = RED_HALF;
            }
            draw(true, () => casters);

            expect(masked).toEqual([20, 120, 220]);
        });

        it('should draw a group that does not share its shadows as before', () => {
            expectSameAsLocal(() => [
                group('shared', [square(120, 40, { fillShadow: RED_HALF })]),
                group(true, [square(40, 140, { fillShadow: { ...RED_HALF, xOffset: 10 } })]),
            ]);
        });
    });

    describe('segments', () => {
        const items = () => [square(20, 40, { fillShadow: RED_HALF }), square(220, 40, { fillShadow: RED_HALF })];

        // The shadow of the later group, at 100 to 160, lands on the box of the earlier group, at 120 to 180, and not on a segment.
        const later = (shared: boolean) => () => [
            group('shared', [square(120, 40, { fillShadow: RED_HALF })], { zIndex: 1 }),
            shared
                ? segmentedGroup([square(40, 40, { fillShadow: RED_HALF })], [segment(350, 400)])
                : group(true, [square(40, 40, { fillShadow: RED_HALF })], { zIndex: 2 }),
        ];

        it('should cast the shadows of a group with segments beneath the items of other groups', () => {
            // The shadow covers the earlier box when the later group casts for itself, so this tells the two paths apart.
            expect(at(draw(true, later(false)), 130, 70)).not.toEqual(BLACK);

            expect(at(draw(true, later(true)), 130, 70)).toEqual(BLACK);
        });

        it('should draw the same as the group does for itself, with segments that clip the shadow', () => {
            expectSameAsLocal(() => [segmentedGroup(items(), [segment(100, 250)])]);
        });

        it('should draw the same through the root, whether or not it has segments', () => {
            const withSegments = draw(true, () => [segmentedGroup(items(), [segment(350, 400)])]);
            const without = draw(true, () => [segmentedGroup(items(), [])]);

            expectNearPixels(pixelsOf(withSegments), pixelsOf(without));
        });

        it('should clip the shadow to the gaps between segments', () => {
            const scene = draw(true, () => [segmentedGroup(items(), [segment(100, 250)])]);

            // The first shadow is at 80 to 140, of which 80 to 100 is in the gap. The second is at 280 to 340.
            expect(isHalfRed(at(scene, 90, 70))).toBe(true);
            expect(at(scene, 120, 70)).toEqual([0, 0, 0, 0]);
            expect(isHalfRed(at(scene, 300, 70))).toBe(true);
        });

        it('should take part in the root through a transform and a clip of its own', () => {
            expectSameAsLocal(() => [
                (() => {
                    const node = new SegmentedGroup({ name: 'moved', batchShadows: 'shared' });
                    node.translationX = 30;
                    node.translationY = 20;
                    node.segments = [segment(250, 300)];
                    for (const child of items()) node.appendChild(child);
                    return node;
                })(),
            ]);
        });
    });

    describe('when the root cannot cast', () => {
        const series = (second: typeof RED_HALF) => () => [
            group('shared', [square(120, 40, { fillShadow: RED_HALF })]),
            group('shared', [square(40, 40, { fillShadow: second })]),
        ];

        it('should draw nothing from the root and let every group batch its own, for a shadow that cannot be cast', () => {
            const build = series(UNUSABLE);
            const scene = draw(true, build);

            // The first group's shadow is drawn once, as it is for itself, and not twice.
            expectNearPixels(pixelsOf(scene), pixelsOf(draw(false, build)));
            expect(isHalfRed(at(scene, 190, 70))).toBe(true);
        });

        it('should draw nothing from the root and let every group batch its own, when the cast throws', () => {
            class Throwing extends Rect {
                override getSpreadMaskStrength(): number | undefined {
                    throw new Error('mask strength');
                }
            }
            const build = () => [
                group('shared', [square(120, 40, { fillShadow: RED_HALF })]),
                group('shared', [
                    Object.assign(new Throwing(), {
                        x: 40,
                        y: 40,
                        width: 60,
                        height: 60,
                        fill: 'black',
                        fillShadow: { ...RED_HALF, spread: 3 },
                    }),
                ]),
            ];
            const local = pixelsOf(draw(false, build));

            expectNearPixels(pixelsOf(draw(true, build)), local);
            expect(console.warn).toHaveBeenCalled();
        });

        describe('when a caster fails to draw its mask', () => {
            /** A caster that fails its first `failures` mask draws, the way a caster whose draw error is caught does. */
            class FailingRect extends Rect {
                static failures = 0;

                override isolatedRender(renderCtx: RenderContext) {
                    if (shadowPass.state === 'mask' && FailingRect.failures > 0) {
                        FailingRect.failures--;
                        return false;
                    }
                    return super.isolatedRender(renderCtx);
                }
            }

            // The shadows of the groups differ, so each has a key of its own, and the second key's draw is the one that fails.
            const failing = () =>
                Object.assign(new FailingRect(), {
                    x: 40,
                    y: 140,
                    width: 60,
                    height: 60,
                    fill: 'black',
                    fillShadow: { ...RED_HALF, xOffset: 70 },
                });
            const build = () => [
                group('shared', [square(120, 40, { fillShadow: RED_HALF })]),
                group('shared', [failing()]),
            ];

            beforeEach(() => {
                FailingRect.failures = 0;
            });

            it('should not cast the shadows of the groups again, as a draw that failed is not one that can be made again', () => {
                FailingRect.failures = 1;
                const scene = draw(true, build);

                // The root drew the first shadow, and the group does not draw it again.
                expect(isHalfRed(at(scene, 190, 70))).toBe(true);
            });

            it('should cast the shadow that failed on a later frame', () => {
                const cast = pixelsOf(draw(true, build));

                FailingRect.failures = 1;
                const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
                for (const child of build()) root.appendChild(child);
                const scene = newScene(root);
                scene.render();
                expect(isHalfRed(at(scene, 140, 170))).toBe(false);

                for (let i = 0; i < 2; i++) {
                    root.markDirty();
                    scene.render();
                }
                expectNearPixels(pixelsOf(scene), cast);
            });
        });

        it('should repaint a clean layer when the root stops casting for it, and again when it resumes', () => {
            const layer = group(false, [], { renderToOffscreenCanvas: true });
            layer.appendChild(group('shared', [square(120, 40, { fillShadow: RED_HALF })]));
            const other = group('shared', [square(40, 40, { fillShadow: RED_HALF })]);
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            root.appendChild(layer);
            root.appendChild(other);
            const scene = newScene(root);
            const failed = (build: () => Group[]) => pixelsOf(draw(false, build));
            const buildWith = (second: typeof RED_HALF) => () => {
                const l = group(false, [], { renderToOffscreenCanvas: true });
                l.appendChild(group('shared', [square(120, 40, { fillShadow: RED_HALF })]));
                return [l, group('shared', [square(40, 40, { fillShadow: second })])];
            };

            scene.render();
            expectNearPixels(pixelsOf(scene), pixelsOf(draw(true, buildWith(RED_HALF))));

            ([...other.children()][0] as Rect).fillShadow = UNUSABLE;
            root.markDirty();
            scene.render();
            expectNearPixels(pixelsOf(scene), failed(buildWith(UNUSABLE)));

            ([...other.children()][0] as Rect).fillShadow = RED_HALF;
            root.markDirty();
            scene.render();
            expectNearPixels(pixelsOf(scene), pixelsOf(draw(true, buildWith(RED_HALF))));
        });
    });

    describe('opacity', () => {
        const SPREAD = { ...RED_HALF, xOffset: 0, spread: 8 };

        it.each([
            [
                'a group that shares its shadows',
                () => [group('shared', [square(40, 40, { fillShadow: RED_HALF })], { opacity: 0.5 })],
            ],
            [
                'a group above it',
                () => [group(false, [group('shared', [square(40, 40, { fillShadow: RED_HALF })])], { opacity: 0.5 })],
            ],
            [
                'two groups',
                () => [
                    group(false, [group('shared', [square(40, 40, { fillShadow: RED_HALF })], { opacity: 0.5 })], {
                        opacity: 0.5,
                    }),
                ],
            ],
            [
                'a layer above it',
                () => [
                    group(false, [group('shared', [square(40, 40, { fillShadow: RED_HALF })])], {
                        opacity: 0.5,
                        renderToOffscreenCanvas: true,
                    }),
                ],
            ],
            [
                'a layer that shares its shadows',
                () => [
                    group('shared', [square(40, 40, { fillShadow: RED_HALF })], {
                        opacity: 0.5,
                        renderToOffscreenCanvas: true,
                    }),
                ],
            ],
            [
                'a translucent item with a spread',
                () => [
                    group(
                        false,
                        [group('shared', [square(40, 40, { fillShadow: SPREAD, fillOpacity: 0.5 })], { opacity: 0.5 })],
                        { opacity: 0.8 }
                    ),
                ],
            ],
            [
                'an item with an opacity',
                () => [group('shared', [square(40, 40, { fillShadow: RED_HALF, opacity: 0.5 })])],
            ],
        ])('should cast the shadow at the opacity that its layer does, for %s', (_name, build) => {
            expectSameAsLocal(build);
        });

        it('should cast no shadow for a group that is fully transparent, beside one that is not, with a spread', () => {
            const visible = () => group('shared', [square(220, 40, { fillShadow: SPREAD })], { opacity: 0.5 });
            const hidden = () => group('shared', [square(40, 40, { fillShadow: SPREAD })], { opacity: 0 });

            const both = draw(true, () => [hidden(), visible()]);

            expectNearPixels(pixelsOf(both), pixelsOf(draw(true, () => [visible()])));
            expect(at(both, 70, 70)).toEqual([0, 0, 0, 0]);
            expectNearPixels(pixelsOf(both), pixelsOf(draw(false, () => [hidden(), visible()])));
        });

        it('should fade the shadow with the group that holds it', () => {
            const half = at(
                draw(true, () => [group('shared', [square(40, 40, { fillShadow: RED_HALF })], { opacity: 0.5 })]),
                130,
                70
            );
            const full = at(
                draw(true, () => [group('shared', [square(40, 40, { fillShadow: RED_HALF })])]),
                130,
                70
            );

            expect(full[3]).toBeGreaterThan(half[3]);
            expect(half[3]).toBeGreaterThan(0);
        });
    });

    describe('canvases', () => {
        const setup = () => {
            const before = new Set(canvasCtx.getActiveOffscreenCanvasInstances());
            const rects = [square(20, 40, { fillShadow: RED_HALF }), square(220, 40, { fillShadow: RED_HALF })];
            const shared = rects.map((rect) => group('shared', [rect]));
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            for (const child of shared) root.appendChild(child);
            const scene = newScene(root);
            scene.render();
            expect(inUse(before).length).toBeGreaterThan(0);
            return { before, rects, shared, root, scene };
        };

        it('should free what the root holds when shadows switch off, though the groups stay', () => {
            const { before, rects, scene } = setup();

            for (const rect of rects) rect.fillShadow = undefined;
            scene.render();

            expect(inUse(before)).toEqual([]);
        });

        it('should free what the root holds when every group is hidden, and cast again when one is shown', () => {
            const { before, shared, scene } = setup();

            for (const node of shared) node.visible = false;
            scene.render();
            expect(inUse(before)).toEqual([]);

            shared[0].visible = true;
            scene.render();
            expect(inUse(before).length).toBeGreaterThan(0);
        });

        it('should hold no canvas for a root with no shadow to cast', () => {
            const before = new Set(canvasCtx.getActiveOffscreenCanvasInstances());
            const scene = newScene(
                (() => {
                    const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
                    root.appendChild(group('shared', [square(20, 40)]));
                    return root;
                })()
            );
            scene.render();

            expect(inUse(before)).toEqual([]);
        });
    });

    describe('cache', () => {
        const casters = () => {
            const rects = [20, 120, 220].map((x) => {
                const rect = new TestRect();
                Object.assign(rect, { x, y: 40, width: 40, height: 40, fill: 'black', fillShadow: RED_HALF });
                return rect;
            });
            const translatable = (children: readonly Node[]) => {
                const node = new TranslatableGroup({ name: 'shared-group', batchShadows: 'shared' });
                for (const child of children) node.appendChild(child);
                return node;
            };
            return { rects, groups: [translatable(rects.slice(0, 2)), translatable(rects.slice(2))] };
        };

        const redraw = (scene: Scene, root: Group) => {
            masked = [];
            root.markDirty();
            scene.render();
            return masked.length;
        };

        it('should blit the shadows of the root again when nothing that casts changed', () => {
            const { groups } = casters();
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            for (const child of groups) root.appendChild(child);
            const scene = newScene(root);
            scene.render();

            // The second cast is the first to be kept, and the next ones blit it.
            expect(redraw(scene, root)).toBeGreaterThan(0);
            expect(redraw(scene, root)).toBe(0);
            expect(redraw(scene, root)).toBe(0);
        });

        it('should cast again when a caster of any group changes, or a group fades or moves', () => {
            const { groups, rects } = casters();
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            for (const child of groups) root.appendChild(child);
            const scene = newScene(root);
            scene.render();
            redraw(scene, root);
            expect(redraw(scene, root)).toBe(0);

            rects[2].width = 50;
            expect(redraw(scene, root)).toBeGreaterThan(0);

            groups[0].opacity = 0.5;
            expect(redraw(scene, root)).toBeGreaterThan(0);

            const moving = groups[1] as TranslatableGroup;
            moving.translationX = 10;
            expect(redraw(scene, root)).toBeGreaterThan(0);
        });
    });

    describe('canvas size', () => {
        // A layer over what a cache holds, and whose masks together are over what a browser can allocate.
        const LARGE_WIDTH = 4200;
        const LARGE_HEIGHT = 4000;
        const DOWN = { ...RED_HALF, xOffset: 0, yOffset: 60 };

        setupMockCanvas({ width: LARGE_WIDTH, height: LARGE_HEIGHT });

        const drawLarge = (series: readonly Group[], renders = 1) => {
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            for (const child of series) root.appendChild(child);
            const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
            scene.resize(LARGE_WIDTH, LARGE_HEIGHT, 1);
            scene.setRoot(root);
            scenes.push(scene);
            for (let i = 0; i < renders; i++) {
                root.markDirty();
                scene.render();
            }
            return scene;
        };

        it('should cast beneath the items of an earlier group on a canvas that a cache would not hold', () => {
            const scene = drawLarge(
                [
                    group('shared', [square(120, 40, { fillShadow: RED_HALF })], { zIndex: 1 }),
                    group('shared', [square(40, 40, { fillShadow: RED_HALF })], { zIndex: 2 }),
                ],
                // A repeated cast is the one that would keep its shadows on a canvas of its own.
                3
            );

            expect(scene.canvas.context.canvas.width * scene.canvas.context.canvas.height).toBeGreaterThan(4096 * 4096);
            expect(at(scene, 130, 70)).toEqual(BLACK);
            expect(isHalfRed(at(scene, 105, 70))).toBe(true);
        });

        it('should cast beneath the items of an earlier group when the masks of its keys differ in shape', () => {
            // One key's mask is wider than the layer and the other's taller, so that together they are over the most pixels
            // that a scratch canvas has, though each is within it.
            const scene = drawLarge([
                group('shared', [square(120, 40, { fillShadow: RED_HALF })], { zIndex: 1 }),
                group('shared', [square(40, 40, { fillShadow: RED_HALF })], { zIndex: 2 }),
                group('shared', [square(300, 40, { fillShadow: DOWN })], { zIndex: 3 }),
            ]);

            expect(at(scene, 130, 70)).toEqual(BLACK);
            expect(isHalfRed(at(scene, 105, 70))).toBe(true);
            expect(isHalfRed(at(scene, 320, 130))).toBe(true);
        });
    });

    describe('after the groups cast for themselves', () => {
        it('should cast through the root again, with nothing kept by the groups it covers', () => {
            const before = new Set(canvasCtx.getActiveOffscreenCanvasInstances());
            const later = square(40, 40, { fillShadow: UNUSABLE });
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            root.appendChild(group('shared', [square(120, 40, { fillShadow: RED_HALF })], { zIndex: 1 }));
            root.appendChild(group('shared', [later], { zIndex: 2 }));
            const scene = newScene(root);
            const frames = (count: number) => {
                for (let i = 0; i < count; i++) {
                    root.markDirty();
                    scene.render();
                }
            };

            frames(3);
            expect(at(scene, 130, 70)).not.toEqual(BLACK);

            later.fillShadow = RED_HALF;
            frames(3);

            expect(at(scene, 130, 70)).toEqual(BLACK);
            // The scratch canvas and the cache of the root are all that is held.
            expect(inUse(before).length).toBeLessThanOrEqual(2);
        });
    });

    describe('cost', () => {
        const spy = (name: 'gatherShadows' | 'gatherShadowChildren') => vi.spyOn(Group.prototype, name);

        it('should not visit the groups of a chart that casts no shadow', () => {
            const gather = spy('gatherShadows');
            const gatherChildren = spy('gatherShadowChildren');

            draw(true, () => Array.from({ length: 20 }, () => group('shared', [square(20, 40)])));

            expect(gather).not.toHaveBeenCalled();
            expect(gatherChildren).not.toHaveBeenCalled();
        });

        it('should visit the groups that cast, and those that hold them, and no others', () => {
            const gather = spy('gatherShadows');

            draw(true, () => [
                ...Array.from({ length: 10 }, () => group('shared', [square(20, 40)])),
                group(false, [group('shared', [square(40, 40, { fillShadow: RED_HALF })])]),
                group('shared', [square(120, 40, { fillShadow: RED_HALF })]),
            ]);

            // The group that holds a caster, the caster's, and the other that casts.
            expect(gather).toHaveBeenCalledTimes(3);
        });

        it('should not read the casters of the groups again when nothing in them changed', () => {
            const rects = [20, 120, 220].map((x) => box(x, 40, 40, 40, { fillShadow: RED_HALF }));
            let reads = 0;
            for (const rect of rects) {
                let revision = rect.revision;
                Object.defineProperty(rect, 'revision', {
                    get: () => {
                        reads++;
                        return revision;
                    },
                    set: (value: number) => {
                        revision = value;
                    },
                });
            }
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            root.appendChild(group('shared', rects.slice(0, 2)));
            root.appendChild(group('shared', rects.slice(2)));
            const scene = newScene(root);
            const redraw = () => {
                root.markDirty();
                scene.render();
            };
            scene.render();
            redraw();
            redraw();

            reads = 0;
            redraw();
            expect(reads).toBe(0);

            rects[2].width = 50;
            redraw();
            expect(reads).toBeGreaterThan(0);
        });
    });
});
