import { afterEach, describe, expect, it } from 'vitest';

import { Logger } from 'ag-charts-core';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { Group } from './group';
import { Scene } from './scene';
import { releaseShadowScratch } from './shadowCompositor';
import { Path } from './shape/path';
import { Rect } from './shape/rect';
import type { Shape } from './shape/shape';

const WIDTH = 400;
const HEIGHT = 220;

// The layer is transparent, so the alpha of a pixel is the strength of the shadow cast on it.
const RED_HALF = { enabled: true, color: 'rgba(255, 0, 0, 0.5)', xOffset: 100, yOffset: 0, blur: 0 };
const BLUE = { enabled: true, color: 'rgba(0, 0, 255, 1)', xOffset: 100, yOffset: 0, blur: 0 };
const IN_PLACE = { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 };

const BLACK = [0, 0, 0, 255];
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

        it('should cast for itself when its shadow reaches further than the layer is wide', () => {
            const casters = () => [
                box(20, 40, 40, 40, { fillShadow: { ...RED_HALF, xOffset: WIDTH * 2 } }),
                box(20, 130, 40, 40, { fillShadow: { ...RED_HALF, xOffset: WIDTH * 2 } }),
            ];
            const before = offscreenCanvases();
            renderNodes(casters());

            expect(createdSince(before)).toHaveLength(0);
            expect(at(30, 60)).toEqual(BLACK);
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
