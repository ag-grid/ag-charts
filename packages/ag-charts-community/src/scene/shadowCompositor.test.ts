import { afterEach, describe, expect, it, vi } from 'vitest';

import { Group, Logger, Path, Rect, Scene, SegmentedGroup, Translatable, releaseShadowScratch } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';

import { setupMockCanvas } from '../util/test/mockCanvas';

const WIDTH = 400;
const HEIGHT = 220;

// The layer is transparent, so the alpha of a pixel is the strength of the shadow cast on it.
const RED_HALF = { enabled: true, color: 'rgba(255, 0, 0, 0.5)', xOffset: 100, yOffset: 0, blur: 0 };
const BLUE = { enabled: true, color: 'rgba(0, 0, 255, 1)', xOffset: 100, yOffset: 0, blur: 0 };
const IN_PLACE = { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 };

const BLACK = [0, 0, 0, 255];

const maxAlphaOf = (data: number[]) => data.reduce((max, value, i) => (i % 4 === 3 ? Math.max(max, value) : max), 0);
const BLUE_PIXEL = [0, 0, 255, 255];
const CLEAR = [0, 0, 0, 0];

type Pixel = number[];

const isHalfRed = (pixel: Pixel) =>
    pixel[0] === 255 && pixel[1] === 0 && pixel[2] === 0 && Math.abs(pixel[3] - 128) <= 1;

const box = (x: number, y: number, width: number, height: number, mixin: Partial<Rect> = {}) => {
    const node = new Rect();
    Object.assign(node, { x, y, width, height, fill: 'black', stroke: undefined, strokeWidth: 0, ...mixin });
    return node;
};

// The stroke of a Rect is inset, but that of a Path is centred on its edge.
const pathBox = (x: number, y: number, width: number, height: number, mixin: Partial<Path> = {}) => {
    const node = new Path();
    Object.assign(node, { fill: 'black', stroke: undefined, strokeWidth: 0, ...mixin });
    node.path.rect(x, y, width, height);
    return node;
};

const whisker = (x: number, y: number, mixin: Partial<Path>) => {
    const node = new Path();
    Object.assign(node, { fill: undefined, strokeWidth: 8, ...mixin });
    node.path.moveTo(x, y);
    node.path.lineTo(x, y + 50);
    return node;
};

describe('Group shadow compositor', () => {
    const canvasCtx = setupMockCanvas({ width: WIDTH, height: HEIGHT });

    const groups: Group[] = [];

    afterEach(() => {
        // Groups outside a scene share a scratch canvas, which must not outlive the test that created it.
        for (const group of groups.splice(0)) releaseShadowScratch(undefined, group);
    });

    const ctx = () => canvasCtx.getRenderContext2D();

    const at = (x: number, y: number): Pixel => Array.from(ctx().getImageData(x, y, 1, 1).data);

    const clearCanvas = () => ctx().clearRect(0, 0, WIDTH, HEIGHT);

    const offscreenCanvases = () => new Set(canvasCtx.getActiveOffscreenCanvasInstances());

    const createdSince = (before: Set<OffscreenCanvas>) =>
        canvasCtx.getActiveOffscreenCanvasInstances().filter((canvas) => !before.has(canvas));

    const createGroup = (children: readonly Shape[], batchShadows = true) => {
        const group = new Group({ name: 'shadow-group' });
        group.batchShadows = batchShadows;
        for (const child of children) group.appendChild(child);
        groups.push(group);
        return group;
    };

    const renderGroup = (group: Group, devicePixelRatio = 1) => {
        const renderCtx = {
            ctx: ctx(),
            direction: 'ltr' as const,
            width: WIDTH,
            height: HEIGHT,
            devicePixelRatio,
            logger: new Logger(),
            debugNodes: {},
        };
        clearCanvas();
        ctx().save();
        ctx().scale(devicePixelRatio, devicePixelRatio);
        group.preRender(renderCtx);
        group.render(renderCtx);
        ctx().restore();
    };

    // Nodes draw in the order they were created, so the children must be created in the order they should draw.
    const renderNodes = (children: readonly Shape[], batchShadows = true) => {
        const group = createGroup(children, batchShadows);
        renderGroup(group);
        return group;
    };

    const paintedPixels = () => {
        const { data } = ctx().getImageData(0, 0, WIDTH, HEIGHT);
        let painted = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) painted++;
        return painted;
    };

    describe('silhouette shadows', () => {
        // Two boxes, each with a 10px stroke centred on the edge of a fill 20 to 60 across, and shadows 100px right.
        const strokedBoxes = (mixin: Partial<Path>) => [
            pathBox(20, 40, 40, 60, { fill: 'black', stroke: 'black', strokeWidth: 10, ...mixin }),
            pathBox(20, 130, 40, 60, { fill: 'black', stroke: 'black', strokeWidth: 10, ...mixin }),
        ];

        it('should not darken the shadow where a stroke meets its fill', () => {
            renderNodes(strokedBoxes({ fillShadow: RED_HALF, shadowMode: 'silhouette' }));

            // The silhouette is 15 to 65 across, so its shadow is 115 to 165. The stroke covers 15 to 25 and 55 to 65.
            expect(isHalfRed(at(117, 70))).toBe(true);
            expect(isHalfRed(at(120, 70))).toBe(true);
            expect(isHalfRed(at(140, 70))).toBe(true);
            expect(isHalfRed(at(160, 70))).toBe(true);
            expect(isHalfRed(at(163, 160))).toBe(true);
            expect(at(113, 70)).toEqual(CLEAR);
            expect(at(167, 70)).toEqual(CLEAR);
        });

        it('should not cast a shadow from the stroke of a fill mode shape', () => {
            renderNodes(strokedBoxes({ fillShadow: RED_HALF, shadowMode: 'fill' }));

            // The fill is 20 to 60 across, so its shadow is 120 to 160. The stroke would reach 115 to 165.
            expect(isHalfRed(at(123, 70))).toBe(true);
            expect(isHalfRed(at(157, 70))).toBe(true);
            expect(at(117, 70)).toEqual(CLEAR);
            expect(at(163, 70)).toEqual(CLEAR);
        });

        it('should not darken the shadow where two items of a batch overlap', () => {
            renderNodes([box(20, 40, 60, 60, { fillShadow: RED_HALF }), box(50, 70, 60, 60, { fillShadow: RED_HALF })]);

            // The shadows are 120 to 180 and 150 to 210 across, and overlap at 150 to 180 across and 70 to 100 down.
            expect(isHalfRed(at(135, 55))).toBe(true);
            expect(isHalfRed(at(165, 85))).toBe(true);
            expect(isHalfRed(at(195, 115))).toBe(true);
        });
    });

    describe('shadow beneath the batch', () => {
        // The shadow of the box at 100 to 160 across is at 50 to 110, and so lands on the box at 20 to 80.
        const LEFT_SHADOW = { ...RED_HALF, xOffset: -50 };
        const leftShadowed = () => [
            box(20, 40, 60, 60, { fillShadow: LEFT_SHADOW }),
            box(100, 40, 60, 60, { fillShadow: LEFT_SHADOW }),
        ];

        it('should draw every shadow of a batch beneath every item of the batch', () => {
            renderNodes(leftShadowed());

            expect(at(65, 70)).toEqual(BLACK);
            expect(at(40, 70)).toEqual(BLACK);
            expect(isHalfRed(at(90, 70))).toBe(true);
            expect(at(105, 70)).toEqual(BLACK);
        });

        it('should draw the shadow of a later item over an earlier item when batching is off', () => {
            renderNodes(leftShadowed(), false);

            expect(at(65, 70)[0]).toBeGreaterThan(0);
            expect(at(65, 70)).not.toEqual(BLACK);
        });

        // A series that gives each item a zIndex only to order them, as an aggregated scatter does, still has one batch.
        it('should keep items of different zIndex in one batch', () => {
            const [first, second] = leftShadowed();
            first.zIndex = [-2, 0];
            second.zIndex = [-2, 1];
            renderNodes([first, second]);

            expect(at(65, 70)).toEqual(BLACK);
            expect(isHalfRed(at(90, 70))).toBe(true);
        });

        it('should end a batch at a change of zIndex in a group that batches by layer', () => {
            const [first, second] = leftShadowed();
            first.zIndex = 0;
            second.zIndex = 1;
            const group = createGroup([first, second]);
            group.batchShadowLayers = true;
            renderGroup(group);

            // The shadow of the item on the upper layer lands on the item beneath it.
            expect(at(65, 70)[0]).toBeGreaterThan(0);
            expect(at(65, 70)).not.toEqual(BLACK);
        });
    });

    describe('segmented group', () => {
        const LEFT_SHADOW = { ...RED_HALF, xOffset: -50 };

        // A segment that no item reaches, so that every item is drawn in the gaps between segments.
        const segment = {
            clipRect: { x0: 300, y0: 0, x1: 400, y1: 100 },
            fill: 'green',
            fillOpacity: 1,
            stroke: 'green',
            strokeOpacity: 1,
            strokeWidth: 1,
        };

        const renderSegmented = (segments: (typeof segment)[]) => {
            const group = new SegmentedGroup({ name: 'segmented-group', batchShadows: true });
            group.segments = segments;
            group.appendChild(box(20, 40, 60, 60, { fillShadow: LEFT_SHADOW }));
            group.appendChild(box(100, 40, 60, 60, { fillShadow: LEFT_SHADOW }));
            groups.push(group);
            renderGroup(group);
        };

        it('should draw every shadow of a batch beneath every item when it has segments', () => {
            renderSegmented([segment]);

            expect(at(65, 70)).toEqual(BLACK);
            expect(isHalfRed(at(90, 70))).toBe(true);
            expect(at(105, 70)).toEqual(BLACK);
        });

        it('should draw the same shadows when it has no segments', () => {
            renderSegmented([]);

            expect(at(65, 70)).toEqual(BLACK);
            expect(isHalfRed(at(90, 70))).toBe(true);
        });
    });

    describe('spread', () => {
        it.each(['transparent', 'rgba(0, 0, 0, 0)'])(
            'should spread the shadow of an opaque fill with a stroke colour of %s',
            (stroke) => {
                const shadow = { ...RED_HALF, xOffset: 0, spread: 10 };
                const item = (y: number) =>
                    pathBox(60, y, 40, 50, { fillShadow: shadow, shadowMode: 'silhouette', stroke, strokeWidth: 6 });
                const render = (batchShadows: boolean) => {
                    renderNodes([item(40), item(130)], batchShadows);
                    return Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data);
                };

                const unbatched = render(false);
                const batched = render(true);

                // The shadow reaches the spread past the fill, as the item casts it for itself.
                expect(isHalfRed(at(105, 65))).toBe(true);
                expect(batched).toEqual(unbatched);
            }
        );

        it('should grow the shadow of every item of a batch by the spread', () => {
            const shadow = { ...RED_HALF, spread: 10 };
            renderNodes([box(20, 40, 40, 40, { fillShadow: shadow }), box(20, 130, 40, 40, { fillShadow: shadow })]);

            // Without a spread the shadows are 120 to 160 across, and 40 to 80 and 130 to 170 down.
            for (const [x, y] of [
                [112, 60],
                [140, 32],
                [140, 88],
                [168, 60],
                [112, 150],
                [140, 122],
            ]) {
                expect(isHalfRed(at(x, y))).toBe(true);
            }
            for (const [x, y] of [
                [107, 60],
                [173, 60],
                [140, 27],
                [140, 93],
            ]) {
                expect(at(x, y)).toEqual(CLEAR);
            }
        });

        it('should not grow the shadow of a batch that has no spread', () => {
            renderNodes([
                box(20, 40, 40, 40, { fillShadow: RED_HALF }),
                box(20, 130, 40, 40, { fillShadow: RED_HALF }),
            ]);

            expect(isHalfRed(at(125, 60))).toBe(true);
            expect(at(115, 60)).toEqual(CLEAR);
            expect(at(165, 60)).toEqual(CLEAR);
        });

        it.each([false, true])(
            'should cast a spread shadow as strong as the composited paint of a pattern (batched: %s)',
            (batched) => {
                // A background at 0.5 under a motif at 0.5 is 0.75 where they overlap.
                const pattern = {
                    type: 'pattern' as const,
                    pattern: 'squares' as const,
                    width: 10,
                    height: 10,
                    fill: 'black',
                    fillOpacity: 0.5,
                    backgroundFill: 'black',
                    backgroundFillOpacity: 0.5,
                    strokeWidth: 0,
                };
                const shadow = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', spread: 10 };
                renderNodes(
                    [
                        box(20, 40, 40, 50, { fill: pattern, fillShadow: shadow }),
                        box(20, 130, 40, 50, { fill: pattern, fillShadow: shadow }),
                    ],
                    batched
                );

                for (const pixel of [at(140, 65), at(115, 65), at(140, 155)]) {
                    expect(pixel[3]).toBeGreaterThanOrEqual(190);
                    expect(pixel[3]).toBeLessThanOrEqual(192);
                }
            }
        );

        it('should fade the shadow of a crisp rectangle that is narrower than a pixel, as the rectangle fades', () => {
            const shadow = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', spread: 4 };
            const thin = () => [
                box(20, 40, 0.4, 50, { crisp: true, fillShadow: shadow }),
                box(20, 130, 0.4, 50, { crisp: true, fillShadow: shadow }),
            ];
            renderNodes(thin(), false);
            const alone = Array.from(ctx().getImageData(100, 20, 60, 180).data);

            renderNodes(thin());
            const batched = Array.from(ctx().getImageData(100, 20, 60, 180).data);

            expect(alone.some((value) => value !== 0)).toBe(true);
            expect(Math.max(...alone.filter((_, i) => i % 4 === 3))).toBeLessThan(255);
            expect(batched).toEqual(alone);
        });

        describe('a crisp rectangle that is narrower than a pixel', () => {
            const SOLID = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', spread: 4 };
            // A bar that is 0.4 across, or high, which crisp rendering fades rather than widening to a pixel.
            const bars = {
                thin: () => [
                    box(20, 40, 0.4, 50, { crisp: true, fillShadow: SOLID }),
                    box(20, 130, 0.4, 50, { crisp: true, fillShadow: SOLID }),
                ],
                short: () => [
                    box(20, 40, 50, 0.4, { crisp: true, fillShadow: SOLID }),
                    box(20, 130, 50, 0.4, { crisp: true, fillShadow: SOLID }),
                ],
            };
            const rendered = (devicePixelRatio: number, children: readonly Shape[], batchShadows = true) => {
                renderGroup(createGroup(children, batchShadows), devicePixelRatio);
                return Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data);
            };

            it.each([['thin'], ['short']] as const)(
                'should fade the shadow of a %s crisp bar, as the bar fades',
                (name) => {
                    const alone = rendered(1, bars[name](), false);

                    expect(alone.some((value) => value !== 0)).toBe(true);
                    expect(maxAlphaOf(alone)).toBeLessThan(255);
                    expect(rendered(1, bars[name]())).toEqual(alone);
                }
            );

            it.each([['thin'], ['short']] as const)(
                'should fade the shadow of a %s crisp bar at a device pixel ratio of 2, as the bar fades',
                (name) => {
                    // A scene gives the casters the layer's pixel ratio, which they size and snap their own shadows by.
                    const renderScene = (batchShadows: boolean) => {
                        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 2 });
                        scene.resize(WIDTH, HEIGHT, 2);
                        const root = new Group({ name: 'root' });
                        root.appendChild(createGroup(bars[name](), batchShadows));
                        scene.setRoot(root);
                        scene.render();
                        const { context } = scene.canvas;
                        const data = Array.from(context.getImageData(0, 0, WIDTH * 2, HEIGHT * 2).data);
                        scene.destroy();
                        return data;
                    };
                    const alone = renderScene(false);

                    expect(alone.some((value) => value !== 0)).toBe(true);
                    expect(maxAlphaOf(alone)).toBeLessThan(255);
                    expect(renderScene(true)).toEqual(alone);
                }
            );

            it.each([['thin'], ['short']] as const)(
                'should leave a %s crisp bar to cast for itself when the browser gives no context for the mask',
                (name) => {
                    const alone = rendered(1, bars[name](), false);

                    // The mask is the first canvas that the batch makes, and the casters then draw their own spread.
                    const noContext = vi.spyOn(OffscreenCanvas.prototype, 'getContext').mockReturnValueOnce(null);
                    let batched: number[];
                    try {
                        batched = rendered(1, bars[name]());
                        expect(noContext).toHaveBeenCalled();
                    } finally {
                        noContext.mockRestore();
                    }

                    expect(alone.some((value) => value !== 0)).toBe(true);
                    expect(batched).toEqual(alone);
                }
            );
        });

        describe('a pattern of several parts', () => {
            const SOLID = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', spread: 10 };

            it.each([false, true])(
                'should cast the shadow of a pattern with a background, a fill and a visible stroke (batched: %s)',
                (batched) => {
                    // 0.5 under 0.5 under 0.5 is 0.875 where all three overlap.
                    const pattern = {
                        type: 'pattern' as const,
                        pattern: 'squares' as const,
                        width: 10,
                        height: 10,
                        fill: 'black',
                        fillOpacity: 0.5,
                        backgroundFill: 'black',
                        backgroundFillOpacity: 0.5,
                        stroke: 'black',
                        strokeOpacity: 0.5,
                        strokeWidth: 2,
                    };
                    renderNodes(
                        [
                            box(20, 40, 40, 50, { fill: pattern, fillShadow: SOLID }),
                            box(20, 130, 40, 50, { fill: pattern, fillShadow: SOLID }),
                        ],
                        batched
                    );

                    for (const pixel of [at(140, 65), at(115, 65), at(140, 155)]) {
                        expect(pixel[3]).toBeGreaterThanOrEqual(222);
                        expect(pixel[3]).toBeLessThanOrEqual(225);
                    }
                }
            );
        });

        describe('a gradient whose last stop has no colour', () => {
            it.each([false, true])(
                'should cast the shadow at the alpha of the colour that the stop inherits (batched: %s)',
                (batched) => {
                    const gradient = {
                        type: 'gradient' as const,
                        gradient: 'linear' as const,
                        colorStops: [{ color: 'rgba(0, 0, 255, 0.4)', stop: 0 }, { stop: 1 }],
                    };
                    const shadow = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', spread: 10 };
                    renderNodes(
                        [
                            box(20, 40, 40, 50, { fill: gradient, fillShadow: shadow }),
                            box(20, 130, 40, 50, { fill: gradient, fillShadow: shadow }),
                        ],
                        batched
                    );

                    // 0.4 of 255 is 102.
                    for (const pixel of [at(140, 65), at(115, 65), at(140, 155)]) {
                        expect(pixel[3]).toBeGreaterThanOrEqual(101);
                        expect(pixel[3]).toBeLessThanOrEqual(103);
                    }
                }
            );
        });

        describe('line patterns', () => {
            const shadow = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', spread: 10 };

            it.each([['forward-slanted-lines'], ['backward-slanted-lines'], ['vertical-lines'], ['horizontal-lines']])(
                'should cast no shadow from a %s pattern with no stroke, as its fill is open segments that paint nothing',
                (name) => {
                    // The lines are open segments, so the fill paints nothing, and the stroke is not drawn at 0px.
                    const pattern = {
                        type: 'pattern' as const,
                        pattern: name as 'vertical-lines',
                        fill: 'black',
                        backgroundFill: 'none',
                        strokeWidth: 0,
                    };
                    for (const batched of [false, true]) {
                        renderNodes(
                            [
                                box(20, 40, 40, 50, { fill: pattern, fillShadow: shadow }),
                                box(20, 130, 40, 50, { fill: pattern, fillShadow: shadow }),
                            ],
                            batched
                        );

                        expect(at(140, 65)).toEqual(CLEAR);
                        expect(at(115, 65)).toEqual(CLEAR);
                    }
                }
            );

            it.each([['forward-slanted-lines'], ['backward-slanted-lines'], ['vertical-lines'], ['horizontal-lines']])(
                'should cast the shadow of the strokes of a %s pattern, at the strength of the stroke',
                (name) => {
                    const pattern = {
                        type: 'pattern' as const,
                        pattern: name as 'vertical-lines',
                        // A fill that would count at 0.9 if the lines were closed.
                        fill: 'black',
                        fillOpacity: 0.9,
                        backgroundFill: 'none',
                        stroke: 'black',
                        strokeOpacity: 0.5,
                        strokeWidth: 2,
                    };
                    for (const batched of [false, true]) {
                        renderNodes(
                            [
                                box(20, 40, 40, 50, { fill: pattern, fillShadow: shadow }),
                                box(20, 130, 40, 50, { fill: pattern, fillShadow: shadow }),
                            ],
                            batched
                        );

                        expect(at(140, 65)[3]).toBeGreaterThanOrEqual(127);
                        expect(at(140, 65)[3]).toBeLessThanOrEqual(129);
                    }
                }
            );
        });

        describe('a shape that paints only extras', () => {
            // A shape that paints a stroke apart from its main path, and scales the opacity of what it paints.
            class ExtrasPath extends Path {
                extrasX = 0;
                extrasY = 0;
                protected override getSilhouetteExtrasOpacity() {
                    return 1;
                }
                protected override getPaintOpacityScale() {
                    return 0.5;
                }
                protected override dilateSilhouetteExtras(target: CanvasRenderingContext2D, growth: number) {
                    const extras = new Path2D();
                    extras.moveTo(this.extrasX, this.extrasY);
                    extras.lineTo(this.extrasX, this.extrasY + 50);
                    target.lineWidth = 8 + growth;
                    target.stroke(extras);
                }
            }

            it('should cast its spread shadow at the scaled opacity, whether or not the shadow is batched', () => {
                const shadow = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', xOffset: 0, spread: 4 };
                const extras = (x: number, y: number) => {
                    const node = new ExtrasPath();
                    Object.assign(node, { fill: 'none', stroke: undefined, strokeWidth: 0, fillShadow: shadow });
                    Object.assign(node, { shadowMode: 'silhouette', extrasX: x, extrasY: y });
                    node.path.moveTo(x, y);
                    node.path.lineTo(x, y + 50);
                    return node;
                };
                const alphaAt = (batchShadows: boolean) => {
                    renderNodes([extras(100, 40), extras(200, 130)], batchShadows);
                    return [at(100, 65)[3], at(200, 155)[3]];
                };

                // Half of 255.
                expect(alphaAt(false)).toEqual([128, 128]);
                expect(alphaAt(true)).toEqual([128, 128]);
            });
        });

        describe('the strength of the casters of a batch', () => {
            const shadow = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', spread: 12 };
            const item = (y: number, alpha: number) =>
                box(20, y, 40, 50, { fill: `rgba(0, 0, 255, ${alpha})`, fillShadow: shadow });
            const alphaAt = (x: number, y: number) => at(x, y)[3];

            it('should cast casters of one translucent strength as one shadow, where their spreads overlap', () => {
                // The items are 5px apart, so their 12px spreads overlap in the gap, at y 90 to 95.
                renderNodes([item(40, 0.5), item(95, 0.5), item(150, 0.5)]);

                // Half of 255, beside an item, between two of them, and above the first. Not 0.75, as stacked shadows would be.
                expect([alphaAt(140, 65), alphaAt(140, 92), alphaAt(140, 120), alphaAt(140, 34)]).toEqual([
                    128, 128, 128, 128,
                ]);
            });

            it('should cast casters of different strengths each at their own, where their spreads do not meet', () => {
                const render = (batchShadows: boolean) => {
                    renderNodes([item(40, 0.5), item(130, 1)], batchShadows);
                    return Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data);
                };
                const alone = render(false);

                const batched = render(true);

                expect([alphaAt(140, 65), alphaAt(140, 155)]).toEqual([128, 255]);
                expect(batched).toEqual(alone);
            });

            it('should cast the stronger of casters of different strengths, where their spreads overlap', () => {
                // 5px apart, so their spreads overlap in the gap at y 90 to 95.
                renderNodes([item(40, 0.5), item(95, 1)]);

                // The translucent item's shadow beside it, the gap between the two, and the opaque item's shadow beside it.
                expect([alphaAt(140, 65), alphaAt(140, 92), alphaAt(140, 120)]).toEqual([128, 255, 255]);
            });
        });
    });

    describe('knock-out of a translucent item', () => {
        const INK = { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 };

        const translucent = (y: number, spread?: number) =>
            box(60, y, 60, 50, { fill: 'rgba(0, 0, 255, 0.5)', fillShadow: { ...INK, spread } });

        it('should not show the spread shadow of a translucent item through the item', () => {
            // 6px inside the left edge of the item, which the 12px spread reaches across.
            renderNodes([translucent(30, 12), translucent(130, 12)]);
            const withSpread = at(66, 55);

            renderNodes([translucent(30), translucent(130)]);
            const withoutSpread = at(66, 55);

            expect(withSpread[3]).toBeGreaterThan(0);
            expect(withSpread).toEqual(withoutSpread);
        });

        it('should cast a uniform shadow around a translucent item with a spread', () => {
            renderNodes([translucent(30, 12), translucent(130, 12)]);

            // The ring is as strong at the corner, where the dilation overlaps itself, as it is beside an edge.
            const side = at(54, 55);
            expect(side[3]).toBeGreaterThan(0);
            expect(at(54, 25)).toEqual(side);
        });

        it('should cast a uniform shadow over the fill of a translucent item with a stroke and a spread', () => {
            const stroked = (y: number) =>
                pathBox(60, y, 60, 50, {
                    fill: 'rgba(0, 0, 0, 0.5)',
                    stroke: 'rgba(0, 0, 0, 0.5)',
                    strokeWidth: 2,
                    fillShadow: { ...INK, spread: 6 },
                    shadowMode: 'silhouette',
                });

            renderNodes([stroked(30), stroked(130)], false);
            const unbatched = [at(63, 55), at(66, 55), at(90, 55)];

            renderNodes([stroked(30), stroked(130)]);

            // 3 and 6px inside the left edge, which the stroke and the 6px spread reach across, and the middle.
            expect(unbatched[0][3]).toBeGreaterThan(0);
            expect([at(63, 55), at(66, 55), at(90, 55)]).toEqual(unbatched);
        });

        describe('a stroke with a fill that casts nothing', () => {
            const transparentGradient = {
                type: 'gradient' as const,
                colorStops: [
                    { color: 'rgba(0, 0, 0, 0)', stop: 0 },
                    { color: 'rgba(255, 0, 0, 0)', stop: 1 },
                ],
            };
            const transparentPattern = {
                type: 'pattern' as const,
                pattern: 'squares' as const,
                width: 10,
                height: 10,
                fill: 'rgba(0, 0, 0, 0)',
                backgroundFill: 'rgba(0, 0, 0, 0)',
                strokeOpacity: 0,
            };

            it.each([
                ['colour', 'transparent'],
                ['rgba colour', 'rgba(0, 0, 0, 0)'],
                ['gradient', transparentGradient],
                ['pattern', transparentPattern],
            ])('should cast the whole dilated stroke with a transparent %s fill', (_name, fill) => {
                const item = (y: number) =>
                    pathBox(60, y, 60, 50, {
                        fill,
                        stroke: 'black',
                        strokeWidth: 6,
                        fillShadow: { ...RED_HALF, xOffset: 0, spread: 6 },
                        shadowMode: 'silhouette',
                    });

                renderNodes([item(30), item(130)]);

                // 6px inside the left edge, which the inner half of the stroke and its spread reach across.
                expect(isHalfRed(at(66, 55))).toBe(true);
                expect(isHalfRed(at(66, 155))).toBe(true);
            });
        });

        it.each([['transparent'], ['rgba(0, 0, 255, 0)'], ['rgba(0, 0, 255, 0.5)'], ['blue']])(
            'should cast the same shadow as an item that casts for itself, from an opaque stroke over a %s fill',
            (fill) => {
                const item = (y: number) =>
                    pathBox(40, y, 60, 50, {
                        fill,
                        stroke: 'black',
                        strokeWidth: 6,
                        fillShadow: { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', xOffset: 0, spread: 8 },
                        shadowMode: 'silhouette',
                    });
                // Outside the edge, on the stroke, inside its footprint and in the middle of the fill.
                const xs = [30, 34, 38, 41, 44, 48, 52, 70];

                renderNodes([item(30), item(130)], false);
                const alone = xs.map((x) => at(x, 55));

                renderNodes([item(30), item(130)]);

                expect(alone.some((pixel) => pixel[3] > 0)).toBe(true);
                expect(xs.map((x) => at(x, 55))).toEqual(alone);
                expect(xs.map((x) => at(x, 155))).toEqual(alone);
            }
        );

        describe('a spread shadow of paint that is not a plain colour', () => {
            const item = (y: number, mixin: Partial<Path>) =>
                pathBox(40, y, 60, 50, {
                    stroke: 'black',
                    strokeWidth: 6,
                    fillShadow: { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', xOffset: 0, spread: 8 },
                    shadowMode: 'silhouette',
                    ...mixin,
                });

            const alphaAcross = (y: number) => [30, 34, 38, 41, 44, 48, 52, 70].map((x) => at(x, y)[3]);

            it.each([
                [
                    'a pattern',
                    {
                        type: 'pattern' as const,
                        pattern: 'vertical-lines' as const,
                        fill: 'blue',
                        width: 6,
                        height: 6,
                        strokeWidth: 3,
                    },
                ],
                [
                    'a gradient',
                    {
                        type: 'gradient' as const,
                        gradient: 'linear' as const,
                        colorStops: [
                            { color: 'rgba(0, 0, 255, 0.2)', stop: 0 },
                            { color: 'rgba(0, 0, 255, 1)', stop: 1 },
                        ],
                    },
                ],
            ])('should cast a solid shadow, as it does for itself, from an opaque stroke over %s', (_name, fill) => {
                renderNodes([item(30, { fill }), item(130, { fill })], false);
                const alone = alphaAcross(55);

                renderNodes([item(30, { fill }), item(130, { fill })]);

                expect(alone.includes(255)).toBe(true);
                expect(alphaAcross(55)).toEqual(alone);
                expect(alphaAcross(155)).toEqual(alone);
            });

            it.each([
                ['a transparent fill and stroke', { fill: 'rgba(0, 0, 0, 0)', stroke: 'rgba(0, 0, 0, 0)' }],
                ['a visible stroke of no width', { fill: 'rgba(0, 0, 0, 0)', stroke: 'black', strokeWidth: 0 }],
                ['no stroke, whose default is not drawn', { fill: 'none', stroke: 'rgba(0, 0, 0, 0)' }],
            ])('should cast the stroke of a shape whose pattern paints nothing, with %s', (_name, paint) => {
                // The background is `none`, as a theme resolves it.
                const fill = {
                    type: 'pattern' as const,
                    pattern: 'squares' as const,
                    backgroundFill: 'none',
                    ...paint,
                };
                renderNodes([item(30, { fill }), item(130, { fill })], false);
                const alone = [30, 34, 38].map((x) => at(x, 55)[3]);

                renderNodes([item(30, { fill }), item(130, { fill })]);

                // Outside the edge, which only the stroke's spread reaches.
                expect(alone).toEqual([255, 255, 255]);
                expect([30, 34, 38].map((x) => at(x, 55)[3])).toEqual(alone);
            });
        });

        describe('a spread shadow at fractional coordinates', () => {
            const item = (y: number, mixin: Partial<Path>) =>
                pathBox(60.5, y + 0.25, 40.25, 30.5, {
                    stroke: 'black',
                    strokeWidth: 3,
                    fillShadow: { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', xOffset: 0, spread: 6 },
                    shadowMode: 'silhouette',
                    ...mixin,
                });
            const region = () => Array.from(ctx().getImageData(40, 10, 100, 190).data);
            const worstDifference = (a: number[], b: number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

            it.each([['blue'], ['rgba(0, 0, 255, 1)']])(
                'should leave no seam in the shadow of an opaque %s fill',
                (fill) => {
                    renderNodes([item(30, { fill }), item(130, { fill })], false);
                    const alone = region();

                    renderNodes([item(30, { fill }), item(130, { fill })]);

                    expect(alone.some((value) => value !== 0)).toBe(true);
                    expect(worstDifference(region(), alone)).toBe(0);
                }
            );

            it('should cast the same shadow as an item that casts for itself from a translucent fill', () => {
                const fill = 'rgba(0, 0, 255, 0.5)';
                renderNodes([item(30, { fill }), item(130, { fill })], false);
                const alone = region();

                renderNodes([item(30, { fill }), item(130, { fill })]);

                expect(worstDifference(region(), alone)).toBe(0);
            });
        });

        it('should match the shadow of an item that casts for itself', () => {
            renderNodes([translucent(30, 12), translucent(130, 12)], false);
            const alone = Array.from(ctx().getImageData(40, 10, 100, 90).data);

            renderNodes([translucent(30, 12), translucent(130, 12)]);
            const batched = Array.from(ctx().getImageData(40, 10, 100, 90).data);

            expect(alone.some((value) => value !== 0)).toBe(true);
            expect(batched).toEqual(alone);
        });
    });

    describe('paint that casts nothing', () => {
        const transparentGradient = {
            type: 'gradient' as const,
            colorStops: [
                { color: 'rgba(0, 0, 0, 0)', stop: 0 },
                { color: 'rgba(255, 0, 0, 0)', stop: 1 },
            ],
        };
        const transparentPattern = {
            type: 'pattern' as const,
            pattern: 'squares' as const,
            width: 10,
            height: 10,
            fill: 'rgba(0, 0, 0, 0)',
            backgroundFill: 'rgba(0, 0, 0, 0)',
            strokeOpacity: 0,
        };

        describe.each([undefined, 10])('with a spread of %s', (spread) => {
            const shadow = { ...RED_HALF, spread };

            // The second item of each batch is visible, so that there is a caster in the batch that does cast.
            it.each([
                ['fill colour', { fill: 'rgba(0, 0, 0, 0)' }],
                ['fill opacity', { fill: 'black', fillOpacity: 0 }],
                ['gradient', { fill: transparentGradient }],
                ['pattern', { fill: transparentPattern }],
                // A stop without a colour paints the colour of the stop before it.
                [
                    'gradient whose last stop inherits a transparent colour',
                    {
                        fill: {
                            type: 'gradient' as const,
                            colorStops: [{ color: 'rgba(0, 0, 0, 0)', stop: 0 }, { stop: 1 }],
                        },
                    },
                ],
            ])('should cast no shadow from a transparent %s', (_name, mixin) => {
                renderNodes([
                    box(20, 40, 40, 50, { ...mixin, fillShadow: shadow }),
                    box(20, 130, 40, 50, { fillShadow: shadow }),
                ]);

                expect(isHalfRed(at(140, 155))).toBe(true);
                expect(at(140, 65)).toEqual(CLEAR);
                expect(at(125, 45)).toEqual(CLEAR);
                expect(at(112, 65)).toEqual(CLEAR);
                expect(at(40, 65)).toEqual(CLEAR);
            });

            it.each(['stroke', 'silhouette'] as const)(
                'should cast no shadow from a whisker with a zero alpha stroke in %s mode',
                (shadowMode) => {
                    renderNodes([
                        whisker(40, 30, { stroke: 'rgba(0, 0, 0, 0)', fillShadow: shadow, shadowMode }),
                        whisker(40, 130, { stroke: 'black', fillShadow: shadow, shadowMode }),
                    ]);

                    expect(at(140, 155)[3]).toBeGreaterThan(0);
                    expect(at(140, 55)).toEqual(CLEAR);
                    expect(at(40, 55)).toEqual(CLEAR);
                }
            );

            it('should cast no shadow from a lone transparent item with a spread, beside items with other options', () => {
                const lone = () => box(20, 40, 40, 50, { fill: transparentGradient, fillShadow: shadow });

                renderNodes([lone()]);
                expect(at(140, 65)).toEqual(CLEAR);
                expect(at(125, 45)).toEqual(CLEAR);

                renderNodes([lone(), box(20, 130, 40, 50, { fillShadow: BLUE })]);
                expect(at(140, 65)).toEqual(CLEAR);
                expect(at(125, 45)).toEqual(CLEAR);
                expect(at(140, 155)).toEqual(BLUE_PIXEL);
            });

            it('should cast no shadow from a whisker with a zero stroke opacity', () => {
                renderNodes([
                    whisker(40, 30, { stroke: 'black', strokeOpacity: 0, fillShadow: shadow, shadowMode: 'stroke' }),
                    whisker(40, 130, { stroke: 'black', fillShadow: shadow, shadowMode: 'stroke' }),
                ]);

                expect(at(140, 155)[3]).toBeGreaterThan(0);
                expect(at(140, 55)).toEqual(CLEAR);
            });
        });

        it('should cast a weaker shadow from a translucent fill than from an opaque one', () => {
            renderNodes([
                box(20, 40, 40, 50, { fill: 'rgba(0, 0, 0, 0.5)', fillShadow: BLUE }),
                box(20, 130, 40, 50, { fill: 'black', fillShadow: BLUE }),
            ]);

            expect(at(140, 155)[3]).toBe(255);
            expect(at(140, 65)[3]).toBeGreaterThan(0);
            expect(at(140, 65)[3]).toBeLessThan(255);
        });
    });

    describe('cutout', () => {
        // The cutout is 200 to 260 across. The shadow of the first batch lands on its left part, and that of the
        // second batch on its right part.
        const aroundCutout = () => [
            box(100, 90, 40, 40, { fillShadow: RED_HALF }),
            box(20, 160, 40, 40, { fillShadow: RED_HALF }),
            box(200, 90, 60, 40, { fill: 'rgba(0, 0, 255, 0.5)', drawingMode: 'cutout', fillShadow: RED_HALF }),
            box(140, 90, 20, 40, { fillShadow: RED_HALF }),
            box(20, 20, 40, 40, { fillShadow: RED_HALF }),
        ];

        it('should end a batch at a cutout node', () => {
            renderNodes(aroundCutout());

            // The cutout erased the shadow that the first batch cast beneath it, and left only its own fill.
            const erased = at(220, 110);
            expect(erased.slice(0, 3)).toEqual([0, 0, 255]);
            expect(Math.abs(erased[3] - 128)).toBeLessThanOrEqual(1);
            // The second batch casts after the cutout, so its shadow is over the cutout and not erased by it.
            const over = at(250, 110);
            expect(over[0]).toBeGreaterThan(0);
            expect(over[3]).toBeGreaterThan(190);
        });

        it('should draw the items and shadows around a cutout node', () => {
            renderNodes(aroundCutout());

            expect(at(120, 110)).toEqual(BLACK);
            expect(at(150, 110)).toEqual(BLACK);
            expect(isHalfRed(at(140, 180))).toBe(true);
            expect(isHalfRed(at(140, 40))).toBe(true);
            // The cutout casts its own shadow, as a single caster.
            expect(at(330, 110)[3]).toBeGreaterThan(0);
        });
    });

    describe('mixed shadow options', () => {
        const BLUE_LEFT = { ...BLUE, xOffset: -100 };
        const RED_LEFT = { ...RED_HALF, xOffset: -100 };

        it('should batch each run of shared shadow options separately', () => {
            // The tall box is 20 to 60 across and 20 to 120 down. The red batch casts onto its lower half, from the box
            // beside it, and the blue batch onto its upper half.
            renderNodes([
                box(20, 20, 40, 100, { fillShadow: RED_LEFT }),
                box(120, 80, 40, 40, { fillShadow: RED_LEFT }),
                box(120, 20, 40, 40, { fillShadow: BLUE_LEFT }),
                box(300, 150, 40, 40, { fillShadow: BLUE_LEFT }),
            ]);

            // A shadow is beneath the items of its own batch, and over the items of the batch before it.
            expect(at(40, 100)).toEqual(BLACK);
            expect(at(40, 40)).toEqual(BLUE_PIXEL);
            expect(at(220, 170)).toEqual(BLUE_PIXEL);
        });

        it('should give one item with its own shadow options a shadow of its own', () => {
            // As the item with `highlightedItem.shadow` does.
            renderNodes([
                box(20, 20, 40, 100, { fillShadow: RED_LEFT }),
                box(300, 150, 40, 40, { fillShadow: RED_LEFT }),
                box(120, 20, 40, 170, { fillShadow: BLUE_LEFT }),
                box(20, 130, 40, 60, { fillShadow: RED_LEFT }),
                box(300, 20, 40, 40, { fillShadow: RED_LEFT }),
            ]);

            // Its shadow is over the item drawn before it, in the gap, and under the batch drawn after it.
            expect(at(40, 60)).toEqual(BLUE_PIXEL);
            expect(at(40, 125)).toEqual(BLUE_PIXEL);
            expect(at(40, 160)).toEqual(BLACK);
            // The other items cast their own colour.
            expect(isHalfRed(at(220, 170))).toBe(true);
            expect(isHalfRed(at(220, 40))).toBe(true);
        });
    });

    describe('layer edges', () => {
        it.each([
            [undefined, CLEAR],
            [10, [255, 0, 0, 255]],
        ])('should leave no copy of an item that overhangs the left edge, with a spread of %s', (spread, near) => {
            renderNodes([
                box(-30, 40, 40, 60, { fillShadow: { ...IN_PLACE, spread } }),
                box(-30, 130, 40, 60, { fillShadow: { ...IN_PLACE, spread } }),
            ]);

            // The item covers 0 to 10 across. A spread of 10 grows its shadow to 20.
            expect(at(5, 70)).toEqual(BLACK);
            expect(at(15, 70)).toEqual(near);
            expect(at(25, 70)).toEqual(CLEAR);
            const { data } = ctx().getImageData(WIDTH / 2, 0, WIDTH / 2, HEIGHT);
            expect(data.every((value) => value === 0)).toBe(true);
        });

        it('should leave no copy of an item that overhangs the right edge', () => {
            renderNodes([
                box(WIDTH - 10, 40, 40, 60, { fillShadow: IN_PLACE }),
                box(WIDTH - 10, 130, 40, 60, { fillShadow: IN_PLACE }),
            ]);

            const { data } = ctx().getImageData(0, 0, WIDTH / 2, HEIGHT);
            expect(data.every((value) => value === 0)).toBe(true);
            expect(at(WIDTH - 5, 70)).toEqual(BLACK);
        });

        it('should cast the shadow of an item that overhangs the left edge across the whole item', () => {
            renderNodes([
                box(-30, 40, 40, 60, { fillShadow: { ...RED_HALF, xOffset: 40 } }),
                box(-30, 130, 40, 60, { fillShadow: { ...RED_HALF, xOffset: 40 } }),
            ]);

            // The item is -30 to 10 across, so its shadow is 10 to 50, as it is when the item casts for itself.
            expect(isHalfRed(at(15, 70))).toBe(true);
            expect(isHalfRed(at(45, 70))).toBe(true);
            expect(isHalfRed(at(45, 160))).toBe(true);
            expect(at(55, 70)).toEqual(CLEAR);
        });

        it('should cast the shadow of an item that is off the layer, onto it', () => {
            renderNodes([
                box(-60, 40, 40, 60, { fillShadow: { ...RED_HALF, xOffset: 80 } }),
                box(-60, 130, 40, 60, { fillShadow: { ...RED_HALF, xOffset: 80 } }),
            ]);

            // The items are -60 to -20 across, so their shadows are 20 to 60.
            expect(at(10, 70)).toEqual(CLEAR);
            expect(isHalfRed(at(30, 70))).toBe(true);
            expect(isHalfRed(at(50, 160))).toBe(true);
            expect(at(70, 70)).toEqual(CLEAR);
        });

        it.each([
            ['left', { xOffset: -60, yOffset: 0 }, [box(WIDTH + 20, 40, 40, 60), box(WIDTH + 20, 130, 40, 60)]],
            ['top', { xOffset: 0, yOffset: 60 }, [box(100, -80, 40, 40), box(200, -80, 40, 40)]],
            ['bottom', { xOffset: 0, yOffset: -60 }, [box(100, HEIGHT + 20, 40, 40), box(200, HEIGHT + 20, 40, 40)]],
        ])('should cast a blurred shadow onto the layer from items off the %s edge', (_edge, offset, items) => {
            const shadow = { ...RED_HALF, ...offset, blur: 8, spread: 4 };
            const render = (batchShadows: boolean) => {
                renderNodes(
                    items.map((item) => box(item.x, item.y, item.width, item.height, { fillShadow: shadow })),
                    batchShadows
                );
                return Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data);
            };

            const unbatched = render(false);
            const batched = render(true);

            expect(unbatched.some((value) => value !== 0)).toBe(true);
            expect(batched).toEqual(unbatched);
        });

        it('should draw a batch through the mask when its shadow reaches further than the layer is wide', () => {
            const before = offscreenCanvases();
            const shadow = { ...RED_HALF, xOffset: WIDTH * 2 };
            renderNodes([box(20, 40, 40, 40, { fillShadow: shadow }), box(20, 130, 40, 40, { fillShadow: shadow })]);

            expect(createdSince(before)).toHaveLength(1);
            expect(at(30, 60)).toEqual(BLACK);
            expect(at(30, 150)).toEqual(BLACK);
        });

        it('should cast no shadow from transparent items, however far the shadow reaches', () => {
            const transparentGradient = {
                type: 'gradient' as const,
                colorStops: [
                    { color: 'rgba(0, 0, 0, 0)', stop: 0 },
                    { color: 'rgba(255, 0, 0, 0)', stop: 1 },
                ],
            };
            const shadow = { ...RED_HALF, xOffset: 300, blur: 40, spread: 6 };
            renderNodes([
                box(20, 40, 40, 40, { fill: transparentGradient, fillShadow: shadow }),
                box(20, 130, 40, 40, { fill: transparentGradient, fillShadow: shadow }),
            ]);

            expect(paintedPixels()).toBe(0);
        });
    });

    describe('clipped paths', () => {
        const clipped = (x: number, y: number, clipX: number, mixin: Partial<Path> = {}) => {
            const node = pathBox(x, y, 60, 50, { fillShadow: { ...RED_HALF, xOffset: 30 }, clip: true, ...mixin });
            node.clipX = clipX;
            node.clipY = HEIGHT;
            return node;
        };

        const renderBoth = (nodes: () => Shape[]) => {
            const render = (batchShadows: boolean) => {
                renderNodes(nodes(), batchShadows);
                return Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data);
            };
            const unbatched = render(false);
            return { unbatched, batched: render(true) };
        };

        it('should clip the shadow of a path that is clipped, as it does for itself', () => {
            const { unbatched, batched } = renderBoth(() => [
                clipped(20, 20, 90),
                clipped(20, 100, 90),
                box(200, 160, 40, 40, { fillShadow: RED_HALF }),
            ]);

            // The paths are 20 to 80 across, and their shadows 50 to 110 are clipped at 90, with the shadow's own edge.
            expect(isHalfRed(at(85, 45))).toBe(true);
            expect(at(100, 45)).toEqual(CLEAR);
            expect(batched).toEqual(unbatched);
        });

        it('should cast the shadow of the part of a path that is outside its clip into it', () => {
            const shadow = { ...RED_HALF, xOffset: -60 };
            const before = offscreenCanvases();
            const { unbatched, batched } = renderBoth(() => [
                clipped(100, 20, 90, { fillShadow: shadow }),
                clipped(100, 100, 90, { fillShadow: shadow }),
            ]);

            // The paths are 100 to 160 across, outside their clip of 0 to 90, and their shadows are 40 to 100.
            expect(createdSince(before)).toHaveLength(1);
            expect(isHalfRed(at(60, 45))).toBe(true);
            expect(at(95, 45)).toEqual(CLEAR);
            expect(batched).toEqual(unbatched);
        });

        it('should clip the shadow of a path with a transform of its own in the coordinates of the path', () => {
            const TranslatedPath = Translatable(Path);
            const translated = (y: number) => {
                const node = new TranslatedPath();
                Object.assign(node, {
                    fill: 'black',
                    stroke: undefined,
                    strokeWidth: 0,
                    fillShadow: { ...RED_HALF, xOffset: 30 },
                    clip: true,
                    clipX: 90,
                    clipY: HEIGHT,
                    translationX: 100,
                    translationY: y,
                });
                node.path.rect(20, 0, 60, 50);
                return node;
            };
            const { unbatched, batched } = renderBoth(() => [translated(20), translated(100)]);

            // The paths are 120 to 180 across, and their shadows 150 to 210 are clipped at 100 + 90.
            expect(isHalfRed(at(185, 45))).toBe(true);
            expect(at(195, 45)).toEqual(CLEAR);
            expect(batched).toEqual(unbatched);
        });

        it('should clip each path to its own clip', () => {
            const { unbatched, batched } = renderBoth(() => [
                clipped(20, 20, 90),
                clipped(20, 100, 100),
                clipped(20, 150, 90),
            ]);

            // Their shadows are 50 to 110 across, outside the paths from 80, and are clipped at 90, 100 and 90.
            expect(isHalfRed(at(95, 125))).toBe(true);
            expect(at(95, 45)).toEqual(CLEAR);
            expect(at(95, 175)).toEqual(CLEAR);
            expect(batched).toEqual(unbatched);
        });
    });

    describe('device pixel ratio', () => {
        it('should scale the offset of a batch by the device pixel ratio', () => {
            renderGroup(
                createGroup([
                    box(20, 40, 40, 40, { fillShadow: { ...RED_HALF, xOffset: 50 } }),
                    box(20, 130, 40, 40, { fillShadow: { ...RED_HALF, xOffset: 50 } }),
                ]),
                2
            );

            // At twice the ratio the boxes are 40 to 120 across, and the shadow is 100 further, at 140 to 220.
            expect(at(100, 120)).toEqual(BLACK);
            expect(at(130, 120)).toEqual(CLEAR);
            expect(isHalfRed(at(180, 120))).toBe(true);
            expect(at(230, 120)).toEqual(CLEAR);
        });
    });

    describe('groups without batched shadows', () => {
        const casters = () => [
            box(20, 40, 60, 60, { fillShadow: RED_HALF }),
            box(30, 130, 60, 60, { fillShadow: RED_HALF }),
            box(250, 40, 60, 60, { fillShadow: RED_HALF }),
        ];

        it('should take the existing path for a group with no shadow casters', () => {
            const plain = () => [box(20, 40, 60, 60), box(130, 40, 60, 60, { fill: 'red' }), box(250, 40, 60, 60)];
            const before = offscreenCanvases();

            renderNodes(plain());
            const batching = Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data);
            expect(createdSince(before)).toHaveLength(0);

            renderNodes(plain(), false);
            expect(Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data)).toEqual(batching);
            expect(paintedPixels()).toBe(3 * 60 * 60);
        });

        it('should take the existing path for a group whose shadows are disabled', () => {
            const before = offscreenCanvases();

            renderNodes(casters().map((node) => Object.assign(node, { fillShadow: { ...RED_HALF, enabled: false } })));

            expect(createdSince(before)).toHaveLength(0);
            expect(paintedPixels()).toBe(3 * 60 * 60);
        });

        it('should cast the shadow of a group with a single shadow caster through the mask', () => {
            const before = offscreenCanvases();

            renderNodes([box(20, 40, 60, 60, { fillShadow: RED_HALF }), box(250, 40, 60, 60)]);

            expect(createdSince(before)).toHaveLength(1);
            expect(isHalfRed(at(130, 70))).toBe(true);
        });

        it('should not batch the shadows of a group that has not opted in', () => {
            const before = offscreenCanvases();

            renderNodes(casters(), false);

            expect(createdSince(before)).toHaveLength(0);
            expect(isHalfRed(at(130, 70))).toBe(true);
        });

        it('should count the shadow casters again after a child changes', () => {
            const nodes = casters().slice(0, 2);
            const group = createGroup(nodes);
            const before = offscreenCanvases();

            renderGroup(group);
            expect(createdSince(before).length).toBeGreaterThan(0);
            expect(isHalfRed(at(130, 70))).toBe(true);
            expect(isHalfRed(at(140, 160))).toBe(true);

            // One caster is left, which still casts through the mask.
            nodes[1].fillShadow = undefined;
            renderGroup(group);
            expect(isHalfRed(at(130, 70))).toBe(true);
            expect(at(140, 160)).toEqual(CLEAR);

            nodes[1].fillShadow = RED_HALF;
            renderGroup(group);
            expect(isHalfRed(at(130, 70))).toBe(true);
            expect(isHalfRed(at(140, 160))).toBe(true);
        });
    });

    describe('scratch canvas', () => {
        const newScene = () => new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });

        const shadowed = (x: number, y: number) => box(x, y, 40, 40, { fillShadow: RED_HALF });

        const setRoot = (scene: Scene, ...children: Group[]) => {
            const root = new Group({ name: 'root' });
            for (const child of children) root.appendChild(child);
            scene.setRoot(root);
        };

        const inUse = (canvases: OffscreenCanvas[]) => canvases.filter((canvas) => canvas.width > 0);

        it('should keep the mask within what a browser can allocate, with a blur wider than the layer at 2x', () => {
            const before = offscreenCanvases();
            const shadow = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', xOffset: 0, blur: 3000 };
            renderGroup(
                createGroup([
                    box(20, 40, 40, 40, { fillShadow: shadow }),
                    box(20, 130, 40, 40, { fillShadow: shadow }),
                ]),
                2
            );

            const [mask] = inUse(createdSince(before));
            expect(mask.width * mask.height).toBeLessThanOrEqual(4096 * 4096);
            // The item is still cast through the mask, which is blurred beyond the point where it can be seen.
            expect(paintedPixels()).toBeGreaterThan(0);
        });

        it('should let the items cast for themselves when the browser gives no context for the mask', () => {
            const nodes = () => [
                box(20, 40, 40, 40, { fillShadow: RED_HALF }),
                box(20, 130, 40, 40, { fillShadow: RED_HALF }),
            ];
            renderNodes(nodes(), false);
            const alone = Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data);

            const noContext = vi.spyOn(OffscreenCanvas.prototype, 'getContext').mockReturnValue(null);
            let batched: number[];
            try {
                renderNodes(nodes());
                batched = Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data);
            } finally {
                noContext.mockRestore();
            }

            expect(alone.some((value) => value !== 0)).toBe(true);
            expect(batched).toEqual(alone);
        });

        describe('a layer too large for the mask', () => {
            const transparentGradient = {
                type: 'gradient' as const,
                colorStops: [
                    { color: 'rgba(0, 0, 0, 0)', stop: 0 },
                    { color: 'rgba(255, 0, 0, 0)', stop: 1 },
                ],
            };

            const renderLayer = (layerWidth: number, layerHeight: number, group: Group) => {
                const layer = new OffscreenCanvas(layerWidth, layerHeight);
                const layerCtx = layer.getContext('2d')! as unknown as CanvasRenderingContext2D;
                const renderCtx = {
                    ctx: layerCtx,
                    direction: 'ltr' as const,
                    width: layer.width,
                    height: layer.height,
                    devicePixelRatio: 1,
                    logger: new Logger(),
                    debugNodes: {},
                };
                group.preRender(renderCtx);
                group.render(renderCtx);
                return { layer, alpha: (x: number, y: number) => layerCtx.getImageData(x, y, 1, 1).data[3] };
            };

            it.each([
                [4200, 4100],
                [8000, 3000],
            ])(
                'should cast the shadow through a mask of a lower resolution, for a layer of %i x %i',
                (width, height) => {
                    const shadow = { ...RED_HALF, color: 'rgba(255, 0, 0, 1)', spread: 8 };
                    const before = offscreenCanvases();
                    const group = createGroup([
                        box(20, 40, 40, 50, { fill: transparentGradient, fillShadow: shadow }),
                        box(20, 130, 40, 50, { fillShadow: shadow }),
                    ]);

                    const { layer, alpha } = renderLayer(width, height, group);

                    // One mask, within what a browser can allocate, was made for the layer, and the casters did not cast for themselves.
                    const masks = inUse(createdSince(before).filter((canvas) => canvas !== layer));
                    const [mask] = masks;
                    expect(mask.width * mask.height).toBeLessThanOrEqual(4096 * 4096);
                    expect(mask.width).toBeLessThan(width);
                    // The shadow of the visible item sits 100px right of it, at its full strength and in its place, and the
                    // transparent one casts none, even as dilated.
                    expect([alpha(140, 155), alpha(140, 130), alpha(140, 180)]).toEqual([255, 255, 255]);
                    expect([alpha(140, 65), alpha(125, 45), alpha(112, 65)]).toEqual([0, 0, 0]);
                    // Well past the 8px of spread, which a mask of a lower resolution blurs the edge of by a pixel.
                    expect([alpha(104, 155), alpha(176, 155), alpha(140, 114), alpha(140, 196)]).toEqual([0, 0, 0, 0]);
                }
            );
        });

        it('should share one scratch canvas between the groups of a scene', () => {
            const before = offscreenCanvases();
            const scene = newScene();
            const batching = [0, 1, 2].map((i) =>
                createGroup([shadowed(10, 10 + i * 60), shadowed(120, 10 + i * 60)], false)
            );
            setRoot(scene, ...batching);
            scene.render();
            const unbatched = inUse(createdSince(before)).length;

            for (const group of batching) group.batchShadows = true;
            scene.render();

            expect(inUse(createdSince(before)).length - unbatched).toBe(1);
        });

        it('should grow the scratch canvas to fit layers of different proportions', () => {
            const renderCtxFor = (layer: OffscreenCanvas) => ({
                ctx: layer.getContext('2d')! as unknown as CanvasRenderingContext2D,
                direction: 'ltr' as const,
                width: layer.width,
                height: layer.height,
                devicePixelRatio: 1,
                logger: new Logger(),
                debugNodes: {},
            });
            const draw = (group: Group, layer: OffscreenCanvas) => {
                const renderCtx = renderCtxFor(layer);
                group.preRender(renderCtx);
                group.render(renderCtx);
            };
            const wideLayer = new OffscreenCanvas(400, 200);
            const tallLayer = new OffscreenCanvas(200, 400);
            const wide = createGroup([shadowed(10, 10), shadowed(10, 80)]);
            const tall = createGroup([shadowed(10, 10), shadowed(10, 80)]);
            const before = offscreenCanvases();

            draw(wide, wideLayer);
            draw(tall, tallLayer);

            // The canvas that fits the wide layer is replaced by one that fits both, which neither group replaces again.
            const [scratch] = inUse(createdSince(before));
            // The mask reaches 100 further than a layer, for the offset of the shadow, so 500 across the wide one and
            // 300 across the tall one.
            expect(scratch.width).toBe(500);
            expect(scratch.height).toBe(400);
            const created = createdSince(before).length;

            draw(wide, wideLayer);
            draw(tall, tallLayer);

            expect(createdSince(before)).toHaveLength(created);
            expect(inUse(createdSince(before))).toEqual([scratch]);
        });

        it('should free the scratch canvas when shadows switch off', () => {
            const before = offscreenCanvases();
            const scene = newScene();
            const nodes = [shadowed(10, 10), shadowed(10, 80), shadowed(10, 150), shadowed(120, 150)];
            setRoot(scene, createGroup(nodes.slice(0, 2)), createGroup(nodes.slice(2)));
            scene.render();

            const [scratch] = inUse(createdSince(before));
            expect(scratch).toBeDefined();

            // The second group still batches, and keeps the canvas.
            for (const node of nodes.slice(0, 2)) node.fillShadow = undefined;
            scene.render();
            expect(scratch.width).toBeGreaterThan(0);

            for (const node of nodes.slice(2)) node.fillShadow = undefined;
            scene.render();
            expect(scratch.width).toBe(0);
            expect(scratch.height).toBe(0);
        });

        it('should free the scratch canvas when the scene is destroyed', () => {
            const before = offscreenCanvases();
            const scene = newScene();
            setRoot(scene, createGroup([shadowed(10, 10), shadowed(10, 80)]));
            scene.render();

            const [scratch] = inUse(createdSince(before));
            expect(scratch).toBeDefined();

            scene.destroy();
            expect(scratch.width).toBe(0);
        });

        it('should not share a scratch canvas between scenes', () => {
            const before = offscreenCanvases();
            const first = newScene();
            const second = newScene();
            setRoot(first, createGroup([shadowed(10, 10), shadowed(10, 80)]));
            setRoot(second, createGroup([shadowed(10, 10), shadowed(10, 80)]));
            first.render();
            second.render();
            const scratches = inUse(createdSince(before));
            expect(scratches).toHaveLength(2);

            first.destroy();

            expect(inUse(scratches)).toHaveLength(1);
        });
    });
});
