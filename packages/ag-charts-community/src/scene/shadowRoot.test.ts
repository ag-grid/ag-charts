import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    BBox,
    Group,
    Path,
    Rect,
    Scene,
    SegmentedGroup,
    TranslatableGroup,
    overrideTintableShadows,
    shadowPass,
} from 'ag-charts-core';
import type { Node, RenderContext } from 'ag-charts-core';

import { expectSamePixels } from '../chart/test/expectSamePixels';
import { setupMockCanvas } from '../util/test/mockCanvas';
import { BLACK, type Pixel, box, isHalf, isHalfRed, redHalfShadow } from '../util/test/shadowPixels';

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
    let maskedSlots: string[] = [];

    class TestRect extends Rect {
        override isolatedRender(renderCtx: RenderContext) {
            if (shadowPass.state === 'mask') {
                masked.push(this.x);
                maskedSlots.push(`${this.x}:${shadowPass.slot}`);
            }
            return super.isolatedRender(renderCtx);
        }
    }

    beforeEach(() => {
        masked = [];
        maskedSlots = [];
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

    describe('glow slot', () => {
        const BLUE = { enabled: true, fill: 'rgb(0, 0, 255)', xOffset: 0, yOffset: 0, blur: 0 };
        const HALF_BLUE = { ...BLUE, fill: 'rgba(0, 0, 255, 0.5)', yOffset: 60 };
        const isHalfBlue = (pixel: Pixel) => isHalf(pixel, [0, 0, 255]);
        const CLEAR = [0, 0, 0, 0];

        const testRect = (x: number, mixin: Partial<Rect> = {}) => {
            const rect = new TestRect();
            Object.assign(rect, { x, y: 40, width: 60, height: 60, fill: 'black', ...mixin });
            return rect;
        };

        it('should cast the glow of a shape beside its shadow', () => {
            const scene = draw(true, () => [
                group('shared', [square(120, 40, { fillShadow: RED_HALF, fillGlow: HALF_BLUE })]),
            ]);

            // The shadow lands to the right of the square, and the glow below it.
            expect(isHalfRed(at(scene, 210, 70))).toBe(true);
            expect(isHalfBlue(at(scene, 150, 130))).toBe(true);
            expect(at(scene, 150, 70)).toEqual(BLACK);
        });

        it('should cast the glow of a shape that has no shadow', () => {
            const scene = draw(true, () => [group('shared', [square(120, 40, { fillGlow: HALF_BLUE })])]);

            expect(isHalfBlue(at(scene, 150, 130))).toBe(true);
            expect(at(scene, 210, 70)).toEqual([0, 0, 0, 0]);
        });

        it('should stop casting a glow that is removed', () => {
            const caster = square(120, 40, { fillGlow: HALF_BLUE });
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            root.appendChild(group('shared', [caster]));
            const scene = newScene(root);
            scene.render();
            expect(isHalfBlue(at(scene, 150, 130))).toBe(true);

            caster.fillGlow = undefined;
            scene.render();
            expect(at(scene, 150, 130)).toEqual([0, 0, 0, 0]);
        });

        // The shadow of the second square lands at 90 to 150, which is where the glow of the first is.
        it.each([
            ['before', true],
            ['after', false],
        ])('should draw a glow over the shadow of a neighbour that casts %s it', (_, glowFirst) => {
            const glowing = () => square(150, 40, { fillGlow: { ...BLUE, xOffset: -60 } });
            const shadowing = () => square(30, 40, { fillShadow: redHalfShadow(60) });
            const scene = draw(true, () => [
                group('shared', glowFirst ? [glowing(), shadowing()] : [shadowing(), glowing()]),
            ]);

            expect(at(scene, 120, 70)).toEqual([0, 0, 255, 255]);
        });

        it('should draw every glow over the shadows of groups drawn after it', () => {
            const scene = draw(true, () => [
                group('shared', [square(150, 40, { fillGlow: { ...BLUE, xOffset: -60 } })], { zIndex: 1 }),
                group('shared', [square(30, 40, { fillShadow: redHalfShadow(60) })], { zIndex: 2 }),
            ]);

            expect(at(scene, 120, 70)).toEqual([0, 0, 255, 255]);
        });

        it('should draw all the masks of the shadows, then all those of the glows', () => {
            const casters = [20, 120, 220].map((x) => testRect(x, { fillShadow: RED_HALF, fillGlow: RED_HALF }));
            draw(true, () => [group('shared', casters.slice(0, 2)), group('shared', casters.slice(2))]);

            // The shadow and glow of one shape have the same options, but are not one key.
            expect(maskedSlots).toEqual(['20:shadow', '120:shadow', '220:shadow', '20:glow', '120:glow', '220:glow']);
        });

        it('should cast a glow once for the casters that share it, however they are grouped', () => {
            const casters = [20, 120, 220].map((x) => testRect(x, { fillGlow: HALF_BLUE }));
            draw(true, () => [group('shared', casters.slice(0, 1)), group('shared', casters.slice(1))]);

            expect(maskedSlots).toEqual(['20:glow', '120:glow', '220:glow']);
        });

        // A cast is kept from the second repeat, on a canvas as large as the reach of its keys.
        const renderKept = (build: () => Group[]) => {
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            for (const child of build()) root.appendChild(child);
            const scene = newScene(root);
            for (let i = 0; i < 4; i++) {
                root.markDirty();
                scene.render();
            }
            return { root, scene };
        };

        it('should cast again when only the glow of a caster changes', () => {
            const casters = [20, 120].map((x) => testRect(x, { fillShadow: RED_HALF }));
            const { root, scene } = renderKept(() => [group('shared', casters)]);

            maskedSlots = [];
            root.markDirty();
            scene.render();
            expect(maskedSlots).toEqual([]);

            casters[1].fillGlow = HALF_BLUE;
            scene.render();
            expect(maskedSlots).toEqual(['20:shadow', '120:shadow', '120:glow']);
        });

        it('should leave a shadow cast by a group on its own as it was', () => {
            expectSameAsLocal(() => [group('shared', [square(120, 40, { fillShadow: RED_HALF })])]);
        });

        it('should cast the glow of a shape that no root casts through, as its group batches it', () => {
            expectSameAsLocal(() => [group('shared', [square(120, 40, { fillGlow: HALF_BLUE })])]);
        });

        it('should cast the shadow before the glow of a shape that no root casts through', () => {
            const scene = draw(false, () => [
                group('shared', [square(120, 40, { fillShadow: RED_HALF, fillGlow: HALF_BLUE })]),
            ]);

            expect(isHalfRed(at(scene, 210, 70))).toBe(true);
            expect(at(scene, 150, 130)).toEqual([0, 0, 255, 128]);
            expectSameAsLocal(() => [
                group('shared', [square(120, 40, { fillShadow: RED_HALF, fillGlow: HALF_BLUE })]),
            ]);
        });

        it('should cast no glow for a caster that is not visible', () => {
            const scene = draw(true, () => [
                group('shared', [square(120, 40, { fillGlow: HALF_BLUE, visible: false })]),
            ]);

            expect(at(scene, 150, 130)).toEqual([0, 0, 0, 0]);
        });

        // The square is at 120 to 180 across. 10px left of it is inside a spread of 20 and beyond a spread of none, and
        // 30px left of it is beyond the spread of both.
        it.each([
            [
                'the glow, whatever the spread of the shadow',
                { fillShadow: { ...RED_HALF, xOffset: 0 }, fillGlow: { ...BLUE, spread: 20 } },
                (pixel: Pixel) => pixel.join() === '0,0,255,255',
            ],
            [
                'the shadow, whatever the spread of the glow',
                { fillShadow: { ...RED_HALF, xOffset: 0, spread: 20 }, fillGlow: { ...BLUE, yOffset: 200 } },
                isHalfRed,
            ],
        ])('should reach as far as the spread of %s', (_name, mixin, isCast) => {
            const { scene } = renderKept(() => [group('shared', [square(120, 40, mixin)])]);

            expect(isCast(at(scene, 110, 70))).toBe(true);
            expect(at(scene, 90, 70)).toEqual(CLEAR);
        });

        it('should cast the glow of a shape with only a stroke from that stroke, beside a shadow that does not', () => {
            const GLOW = {
                enabled: true,
                glow: true as const,
                fill: 'rgb(0, 255, 0)',
                fillOpacity: 1,
                xOffset: 0,
                yOffset: 0,
                blur: 0,
                spread: 8,
            };
            const outline = (mixin: Partial<Rect>) => () => [
                group('shared', [square(120, 40, { fill: undefined, stroke: 'black', strokeWidth: 4, ...mixin })]),
            ];
            const aloneScene = draw(true, outline({ fillShadow: GLOW }));
            const alone = pixelsOf(aloneScene);
            // Inside the spread of 8 beyond the stroke, which is at 118 to 122, where only the cast reaches.
            expect(at(aloneScene, 113, 70)[3]).toBeGreaterThan(0);

            expect(pixelsOf(draw(true, outline({ fillGlow: GLOW })))).toEqual(alone);
            // The shadow slot has no `glow` flag, so on its own it casts from the fill, of which there is none.
            expect(pixelsOf(draw(true, outline({ fillGlow: GLOW, fillShadow: RED_HALF })))).toEqual(alone);
        });

        it('should clip the glow of a path at the clip of that path, as the group does for itself', () => {
            // A box of 20 to 80 across, whose glow is 50 to 110, so that only the part of it beyond the box shows.
            const clippedPath = (y: number, clipX: number) => {
                const node = new Path();
                Object.assign(node, {
                    fill: 'black',
                    stroke: undefined,
                    strokeWidth: 0,
                    clip: true,
                    clipX,
                    clipY: HEIGHT,
                });
                node.fillGlow = { ...HALF_BLUE, xOffset: 30, yOffset: 0 };
                node.path.rect(20, y, 60, 50);
                return node;
            };
            const build = () => [group('shared', [clippedPath(20, 90), clippedPath(100, 100)])];

            expectSameAsLocal(build);

            // Each path is clipped at its own edge, so the paths do not share a clip.
            const scene = draw(true, build);
            expect(isHalfBlue(at(scene, 85, 45))).toBe(true);
            expect(at(scene, 95, 45)).toEqual(CLEAR);
            expect(isHalfBlue(at(scene, 95, 125))).toBe(true);
            expect(at(scene, 105, 125)).toEqual(CLEAR);
        });

        it('should keep a cast as wide as the stroke that a glow casts from, where the shadow slot has none', () => {
            const GLOW = { ...BLUE, glow: true as const, fill: 'rgb(0, 255, 0)', fillOpacity: 1, spread: 8 };
            // A path strokes across its edge, so the stroke at 130 to 170 reaches 20px past the fill that a shadow casts
            // from, and the glow 8px past that, to 122. The fill alone has the cast start at 142.
            const outline = () => {
                const node = new Path();
                Object.assign(node, { fill: undefined, stroke: 'black', strokeWidth: 40 });
                node.fillGlow = GLOW;
                node.path.rect(150, 40, 60, 50);
                return node;
            };
            const { scene } = renderKept(() => [group('shared', [outline()])]);

            expect(at(scene, 126, 65)).toEqual([0, 255, 0, 255]);
            expect(at(scene, 118, 65)).toEqual(CLEAR);
        });

        it('should cast overlapping glows of casters at one strength as one, as it casts overlapping shadows', () => {
            // The uniform strength is read from the casters of the slot that the key casts, and a caster with a glow alone
            // has no shadow to read it from, so the casters draw their silhouettes solid only if the glow slot is read.
            const GLOW = { ...BLUE, glow: true as const, fillOpacity: 1, spread: 8 };
            const scene = draw(true, () => [
                group('shared', [
                    square(100, 40, { fillGlow: GLOW, fillOpacity: 0.5 }),
                    square(150, 40, { fillGlow: GLOW, fillOpacity: 0.5 }),
                ]),
            ]);

            // Within the spread of both squares at 155 and of one of them at 120. Casters at half strength cast once, at half.
            expect(at(scene, 120, 36)[3]).toBeGreaterThan(0);
            expect(at(scene, 155, 36)).toEqual(at(scene, 120, 36));
        });

        // The glow slot is a second instance of the shadow slot, so what the slot casts alone matches the shadow slot.
        // The items are 40 square, at 20, 90 and 160 across and 60 down. Each row has a pixel that only its cast reaches.
        describe.each([
            ['an offset', RED_HALF, [85, 80]],
            ['a spread', { ...RED_HALF, xOffset: 0, spread: 8 }, [16, 80]],
            ['a spread and an offset', { ...RED_HALF, xOffset: 10, yOffset: 10, spread: 8 }, [70, 80]],
            [
                'no fill',
                { enabled: true, xOffset: 0, yOffset: 0, blur: 0, spread: 8, fillOpacity: 1, glow: true },
                [16, 80],
            ],
        ] as const)('with %s', (_name, options, [probeX, probeY]) => {
            const items = (slot: 'fillShadow' | 'fillGlow') => () =>
                ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'].map((fill, i) =>
                    group('shared', [square(20 + i * 70, 60, { fill, width: 40, height: 40, [slot]: options })])
                );

            // The pixels of a glow are those of the shadow, and the shadow casts onto the pixel that no item covers.
            const expectGlowAsShadow = (shadow: Scene, glow: Scene) => {
                expect(at(shadow, probeX, probeY)[3]).toBeGreaterThan(0);
                expect(pixelsOf(glow)).toEqual(pixelsOf(shadow));
            };

            it('should cast a glow as it casts a shadow', () => {
                expectGlowAsShadow(draw(true, items('fillShadow')), draw(true, items('fillGlow')));
            });

            it('should cast a glow as it casts a shadow where the canvas cannot blur a mask of many colours', () => {
                overrideTintableShadows(false);
                try {
                    expectGlowAsShadow(draw(true, items('fillShadow')), draw(true, items('fillGlow')));
                } finally {
                    overrideTintableShadows();
                }
            });

            it('should cast a glow as it casts a shadow through a group with an opacity', () => {
                const withOpacity = (slot: 'fillShadow' | 'fillGlow') => () =>
                    items(slot)().map((node) => Object.assign(node, { opacity: 0.5 }));

                expectGlowAsShadow(draw(true, withOpacity('fillShadow')), draw(true, withOpacity('fillGlow')));
            });
        });

        describe.each(['fillShadow', 'fillGlow'] as const)('in the %s slot', (slot) => {
            const cutout = () => box(120, 40, 60, 60, { fill: 'blue', drawingMode: 'cutout', [slot]: RED_HALF });

            // The shadow of the cutout is at 180 to 240 across.
            it('should cast a cutout in a layer, whose shadow is not erased by itself', () => {
                const scene = draw(true, () => [group('shared', [cutout()], { renderToOffscreenCanvas: true })]);

                expect(isHalfRed(at(scene, 210, 70))).toBe(true);
            });

            it('should leave a cutout outside a layer to cast for itself', () => {
                const scene = draw(true, () => [group('shared', [cutout()])]);

                // A cutout erases the layer beneath it, so the root skips it: the group casts its shadow, or its glow.
                expect(at(scene, 210, 70)[3]).toBeGreaterThan(0);
            });
        });

        it('should cast the glow of a shape in a layer as the shadow', () => {
            const items = (slot: 'fillShadow' | 'fillGlow') => () => [
                group('shared', [square(20, 40, { [slot]: RED_HALF }), square(220, 40, { [slot]: RED_HALF })], {
                    renderToOffscreenCanvas: true,
                }),
            ];
            const shadow = draw(true, items('fillShadow'));

            expect(isHalfRed(at(shadow, 100, 70))).toBe(true);
            expect(pixelsOf(draw(true, items('fillGlow')))).toEqual(pixelsOf(shadow));
        });

        it('should cast the glow of a group with segments as the shadow, and clip it to the gaps', () => {
            const items = (slot: 'fillShadow' | 'fillGlow') => () => [
                segmentedGroup(
                    [square(20, 40, { [slot]: RED_HALF }), square(220, 40, { [slot]: RED_HALF })],
                    [segment(100, 250)]
                ),
            ];
            const glow = draw(true, items('fillGlow'));

            // As the shadow: the first cast is 80 to 140, of which 80 to 100 is in the gap, and the second is 280 to 340.
            expect(isHalfRed(at(glow, 90, 70))).toBe(true);
            expect(at(glow, 120, 70)).toEqual(CLEAR);
            expect(isHalfRed(at(glow, 300, 70))).toBe(true);
            expect(pixelsOf(glow)).toEqual(pixelsOf(draw(true, items('fillShadow'))));
        });
    });

    describe('a glow cast in the group of its series', () => {
        const GLOW = {
            enabled: true,
            fill: 'rgba(0, 0, 255, 0.5)',
            xOffset: 0,
            yOffset: 60,
            blur: 0,
            glow: true as const,
        };
        const IN_GROUP = { ...GLOW, inGroup: true as const };

        // A series is a group of `shared` groups. Its glow lands below its caster, over where `other` draws a square.
        const hub = (children: readonly Node[]) => {
            const node = new Group({ name: 'series', castsGroupGlows: true });
            for (const child of children) node.appendChild(child);
            return node;
        };
        const caster = (glow: typeof GLOW) => square(120, 40, { fillGlow: glow });
        const other = () => hub([group('shared', [square(120, 110)])]);

        it('should draw beneath the items of an earlier series when the root casts it', () => {
            const scene = draw(true, () => [other(), group('shared', [caster(GLOW)], { zIndex: 2 })]);

            expect(at(scene, 150, 130)).toEqual(BLACK);
        });

        it.each([true, false])('should draw over the items of an earlier series, with a root %s', (root) => {
            const scene = draw(root, () => [other(), hub([group('shared', [caster(IN_GROUP)])])]);

            const [r, g, b] = at(scene, 150, 130);
            expect([r, g]).toEqual([0, 0]);
            expect(b).toBeGreaterThan(0);
        });

        // Whichever of its groups the item is in, and whichever draws first, no group draws a glow over a sibling's item.
        it.each([
            { name: 'in an earlier group', groups: (c: Node, b: Node) => [group('shared', [c]), group('shared', [b])] },
            { name: 'in a later group', groups: (c: Node, b: Node) => [group('shared', [b]), group('shared', [c])] },
            { name: 'in its own group, after it', groups: (c: Node, b: Node) => [group('shared', [c, b])] },
            { name: 'in its own group, before it', groups: (c: Node, b: Node) => [group('shared', [b, c])] },
        ])('should draw beneath an item of its series that casts no glow, $name', ({ groups }) => {
            const scene = draw(true, () => [
                hub(groups(caster(IN_GROUP), square(120, 110))),
                group('shared', [square(300, 10, { fillShadow: RED_HALF })]),
            ]);

            expect(isHalf(at(scene, 150, 105), [0, 0, 255])).toBe(true);
            expect(at(scene, 150, 130)).toEqual(BLACK);
        });

        it('should cast the glow of a cutout, beside its shadow', () => {
            const cutout = square(120, 40, { fillGlow: IN_GROUP, fillShadow: RED_HALF, drawingMode: 'cutout' });
            const scene = draw(true, () => [hub([group('shared', [cutout])])]);

            // Below the cutout, past its shadow's offset and the cutout's own footprint.
            expect(at(scene, 150, 130)[3]).toBeGreaterThan(0);
        });

        it('should blit the glow of an unchanged series on a repaint, rather than blur it again', () => {
            const item = new TestRect();
            Object.assign(item, { x: 120, y: 40, width: 60, height: 60, fillGlow: IN_GROUP });
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            const series = hub([group('shared', [item])]);
            root.appendChild(series);
            const scene = newScene(root);
            const redraw = () => {
                masked = [];
                series.markDirty();
                scene.render();
                return masked.length;
            };
            scene.render();

            // The second cast is the first to be kept, and the next ones blit it.
            expect(redraw()).toBeGreaterThan(0);
            expect(redraw()).toBe(0);
            expect(redraw()).toBe(0);
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

    describe('clips', () => {
        const CLEAR = [0, 0, 0, 0];

        // A box of 20 to 80 across, whose shadow is 50 to 110, so that only the part of it that is beyond the box shows.
        const clippedPath = (y: number, clipX: number) => {
            const node = new Path();
            Object.assign(node, { fill: 'black', stroke: undefined, strokeWidth: 0, clip: true, clipX, clipY: HEIGHT });
            node.fillShadow = redHalfShadow(30);
            node.path.rect(20, y, 60, 50);
            return node;
        };

        const clippedGroup = (clipWidth: number) => {
            const node = group('shared', [square(20, 40, { fillShadow: RED_HALF })]);
            node.setClipRectCanvasSpace(new BBox(0, 0, clipWidth, HEIGHT));
            return node;
        };

        it('should clip the shadow of a path at the clip of that path, as the group does for itself', () => {
            const build = () => [group('shared', [clippedPath(20, 90), clippedPath(100, 100)])];

            expectSameAsLocal(build);

            // Each path is clipped at its own edge, so the paths do not share a clip.
            const scene = draw(true, build);
            expect(isHalfRed(at(scene, 85, 45))).toBe(true);
            expect(at(scene, 95, 45)).toEqual(CLEAR);
            expect(isHalfRed(at(scene, 95, 125))).toBe(true);
            expect(at(scene, 105, 125)).toEqual(CLEAR);
        });

        it('should clip the shadow at the clip rect of its group', () => {
            const build = () => [clippedGroup(100)];

            expectSameAsLocal(build);

            // The shadow is 80 to 140, and is cut at 100.
            const scene = draw(true, build);
            expect(isHalfRed(at(scene, 90, 70))).toBe(true);
            expect(at(scene, 110, 70)).toEqual(CLEAR);
        });

        it('should clip the shadow at the clip rect of its group, through a parent that is translated', () => {
            const build = () => {
                const parent = new TranslatableGroup({ name: 'moved' });
                parent.translationX = 40;
                parent.appendChild(clippedGroup(100));
                return [parent];
            };

            expectSameAsLocal(build);

            // The clip is 0 to 100 in the parent, which is 40 to 140 on the canvas, and the shadow is 120 to 180.
            const scene = draw(true, build);
            expect(isHalfRed(at(scene, 130, 70))).toBe(true);
            expect(at(scene, 150, 70)).toEqual(CLEAR);
        });
    });

    describe('fills', () => {
        // A fill that is transparent at the left of a box, and opaque at the right, so that its shadow follows it.
        const gradient = {
            type: 'gradient' as const,
            gradient: 'linear' as const,
            rotation: 90,
            colorStops: [
                { color: 'rgba(0, 0, 0, 0)', stop: 0 },
                { color: 'rgba(0, 0, 0, 1)', stop: 1 },
            ],
        };
        // The shadow of a box at 40 to 100 down, and 20 to 80 across, falls 50 down, below the box.
        const gradientBox = () => {
            const node = new Path();
            Object.assign(node, { fill: gradient, fillOpacity: 0.8, stroke: undefined, strokeWidth: 0 });
            node.fillShadow = redHalfShadow(0, 50);
            node.path.rect(20, 40, 60, 60);
            return node;
        };

        it('should cast the shadow of a gradient fill at the alpha of the gradient, not at its strongest alpha', () => {
            const build = () => [group('shared', [gradientBox()])];

            expectSameAsLocal(build);

            // The gradient has no alpha at the left edge, so there is no shadow below it, and there is below the right.
            const scene = draw(true, build);
            expect(at(scene, 22, 120)[3]).toBeLessThan(20);
            expect(at(scene, 78, 120)[3]).toBeGreaterThan(60);
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

        it('should not walk the groups of a series that casts no glow, where it casts group glows', () => {
            const collect = vi.spyOn(Group.prototype as any, 'collectChildGroups');

            draw(true, () =>
                Array.from({ length: 20 }, () => {
                    const series = new Group({ name: 'series', castsGroupGlows: true });
                    series.appendChild(group('shared', [group('shared', [square(20, 40)])]));
                    return series;
                })
            );

            expect(collect).not.toHaveBeenCalled();
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
    describe('a glow with no fill around items of different colours', () => {
        const GLOW = { enabled: true, xOffset: 0, yOffset: 0, blur: 0, spread: 8, fillOpacity: 1, glow: true as const };
        const COLOURS = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)', 'rgb(255, 255, 0)', 'rgb(0, 255, 255)'];

        // One group per item, as a series that casts through the root has, so the root is what puts the casters in keys.
        const build = (count: number, fillShadow: (i: number) => Rect['fillShadow']) => () =>
            COLOURS.slice(0, count).map((fill, i) =>
                group('shared', [square(20 + i * 70, 60, { fill, width: 40, height: 40, fillShadow: fillShadow(i) })])
            );

        const blitsOf = (nodes: () => Group[]) => {
            const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
            for (const child of nodes()) root.appendChild(child);
            const scene = newScene(root);
            const blits = vi.spyOn(scene.canvas.context, 'drawImage');
            try {
                scene.render();
                return blits.mock.calls.length;
            } finally {
                blits.mockRestore();
            }
        };

        it('should blit one mask however many colours the items have', () => {
            expect(blitsOf(build(1, () => GLOW))).toBe(1);
            expect(blitsOf(build(COLOURS.length, () => GLOW))).toBe(1);
        });

        it('should make a mask for each colour of a glow that has a fill, as the colour is part of its key', () => {
            expect(blitsOf(build(COLOURS.length, (i) => ({ ...GLOW, fill: COLOURS[i] })))).toBe(COLOURS.length);
        });

        it('should still make a mask for each spread, however many colours the items have', () => {
            expect(blitsOf(build(COLOURS.length, (i) => ({ ...GLOW, spread: i < 3 ? 8 : 2 })))).toBe(2);
        });

        it('should draw the glow around each item in the colour of that item', () => {
            const scene = draw(
                true,
                build(3, () => GLOW)
            );

            // 4px outside the top edge of each item, within the 8px of spread of the glow.
            for (const [i, rgb] of [
                [255, 0, 0],
                [0, 255, 0],
                [0, 0, 255],
            ].entries()) {
                expect(at(scene, 20 + i * 70 + 20, 56)).toEqual([...rgb, 255]);
            }
            expect(at(scene, 40, 48)).toEqual([0, 0, 0, 0]);
        });

        describe('where the canvas cannot blur a mask of many colours', () => {
            beforeEach(() => overrideTintableShadows(false));
            afterEach(() => overrideTintableShadows());

            it('should make a mask for each colour of the items, which the glow has no fill to key by', () => {
                expect(blitsOf(build(1, () => GLOW))).toBe(1);
                expect(blitsOf(build(COLOURS.length, () => GLOW))).toBe(COLOURS.length);
            });

            it('should draw the glow around each item in the colour of that item', () => {
                const scene = draw(
                    true,
                    build(3, () => GLOW)
                );

                for (const [i, rgb] of [
                    [255, 0, 0],
                    [0, 255, 0],
                    [0, 0, 255],
                ].entries()) {
                    expect(at(scene, 20 + i * 70 + 20, 56)).toEqual([...rgb, 255]);
                }
                expect(at(scene, 40, 48)).toEqual([0, 0, 0, 0]);
            });

            it('should cast the glow of a translucent item at the strength of its alpha', () => {
                const scene = draw(true, () => [
                    group('shared', [
                        square(20, 60, { fill: 'rgba(255, 0, 0, 0.5)', width: 40, height: 40, fillShadow: GLOW }),
                    ]),
                ]);

                // A half of a half.
                const [red, green, blue, alpha] = at(scene, 40, 56);
                expect([red, green, blue]).toEqual([255, 0, 0]);
                expect(Math.abs(alpha - 64)).toBeLessThanOrEqual(2);
            });
        });
    });
});
