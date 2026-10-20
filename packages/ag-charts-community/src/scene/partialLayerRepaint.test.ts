import { afterEach, describe, expect, it, vi } from 'vitest';

import { BBox, Group, Node, Scene, TranslatableGroup } from 'ag-charts-core';
import type { RenderContext } from 'ag-charts-core';

import { expectSamePixels } from '../chart/test/expectSamePixels';
import { setupMockCanvas } from '../util/test/mockCanvas';
import { setupMockConsole } from '../util/test/mockConsole';

const WIDTH = 200;
const HEIGHT = 120;

interface Patch {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
}

/**
 * Stands in for a node that opts in to partial repaints: it paints translucent rectangles at fractional positions,
 * so that edges are anti-aliased and overlaps blend, and reports the box of every pixel a change touched.
 */
class PatchNode extends Node {
    private patches: Patch[];
    private dirtyRegion: BBox | undefined;
    failNextRender = false;

    /** `halo` is how far, in CSS pixels, a faint edge reaches past a patch, beyond the box the node reports. */
    constructor(
        patches: Patch[],
        private readonly halo = 0
    ) {
        super();
        this.patches = patches;
    }

    private static boundsOf(patches: Patch[]) {
        return patches.reduce<BBox | undefined>((union, p) => {
            const box = new BBox(p.x, p.y, p.width, p.height);
            return union == null ? box : BBox.merge([union, box]);
        }, undefined);
    }

    protected override computeBBox() {
        return PatchNode.boundsOf(this.patches) ?? new BBox(0, 0, 0, 0);
    }

    /** Replaces the patches, and says that only the pixels they now cover, or covered before, changed. */
    update(patches: Patch[]) {
        const before = PatchNode.boundsOf(this.patches);
        const after = PatchNode.boundsOf(patches);
        this.patches = patches;
        this.dirtyRegion = before != null && after != null ? BBox.merge([before, after]) : (before ?? after);
        this.markDirtyRegion();
    }

    override getDirtyRegion() {
        return this.dirtyRegion;
    }

    override render(renderCtx: RenderContext) {
        if (this.failNextRender) {
            this.failNextRender = false;
            throw new Error('render failure');
        }
        super.render(renderCtx);
        const { ctx } = renderCtx;
        for (const { x, y, width, height, fill } of this.patches) {
            ctx.fillStyle = fill;
            ctx.fillRect(x, y, width, height);
            if (this.halo > 0) {
                const { halo } = this;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(x - halo, y - halo, width + 2 * halo, height + 2 * halo);
            }
        }
    }
}

const patch = (x: number, y: number, width: number, height: number, fill: string): Patch => ({
    x,
    y,
    width,
    height,
    fill,
});

// Nothing here is opaque, and most of the layer is empty, so a region that isn't cleared before it is repainted shows.
const BACKGROUND = [
    patch(5.3, 7.7, 80.4, 40.6, 'rgba(10, 120, 200, 0.5)'),
    patch(60.25, 30.5, 90.75, 55.5, 'rgba(250, 180, 20, 0.45)'),
];

describe('partial layer repaint of a scene', () => {
    setupMockCanvas();
    setupMockConsole();

    let activeScene: Scene | undefined;
    const regionSpy = () => vi.spyOn(Group.prototype as any, 'resolveDirtyRegion');
    let spy: ReturnType<typeof regionSpy> | undefined;

    afterEach(() => {
        spy?.mockRestore();
        activeScene?.destroy();
        activeScene = undefined;
    });

    function mount(opts: { pixelRatio: number; translation: [number, number]; nested?: boolean; halo?: number }) {
        const canvasElement = document.createElement('canvas');
        const scene = new Scene({ canvasElement, pixelRatio: opts.pixelRatio });
        activeScene = scene;
        scene.resize(WIDTH, HEIGHT, opts.pixelRatio);

        const root = new Group({ name: 'root' });
        const shifted = new TranslatableGroup({ name: 'shifted' });
        shifted.translationX = opts.translation[0];
        shifted.translationY = opts.translation[1];
        const layer = new Group({ name: 'layer', renderToOffscreenCanvas: true });
        const background = new PatchNode(BACKGROUND);
        const first = new PatchNode([patch(20.3, 20.6, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)')], opts.halo);
        const second = new PatchNode([patch(40.8, 30.2, 30.6, 25.9, 'rgba(30, 160, 80, 0.6)')]);
        const innerLayer = new Group({ name: 'inner', renderToOffscreenCanvas: true });
        const third = new PatchNode([patch(110.5, 60.5, 20.5, 20.5, 'rgba(120, 40, 200, 0.6)')]);

        root.appendChild(shifted);
        shifted.appendChild(layer);
        layer.appendChild(background);
        layer.appendChild(first);
        layer.appendChild(second);
        if (opts.nested) {
            layer.appendChild(innerLayer);
            innerLayer.appendChild(third);
        }
        scene.setRoot(root);
        scene.render();
        spy = regionSpy();

        const readPixels = () => {
            const { width, height } = scene.canvas.element;
            return scene.canvas.context.getImageData(0, 0, width, height);
        };
        /** Repaints every layer whole, and returns the pixels that paints. */
        const wholeRepaint = () => {
            layer.markDirty();
            innerLayer.markDirty();
            scene.render();
            return readPixels();
        };
        /** Runs a frame, and returns the pixels it painted, and whether a layer repainted only a region. */
        const frame = (change: () => void) => {
            spy!.mockClear();
            change();
            scene.render();
            return {
                pixels: readPixels(),
                partial: spy!.mock.results.some((result) => result.value != null),
            };
        };
        return { scene, root, shifted, layer, innerLayer, first, second, third, frame, wholeRepaint };
    }

    describe.each([1, 1.5, 2])('at a pixel ratio of %s', (pixelRatio) => {
        describe.each([
            ['a whole-pixel', [10, 15] as [number, number]],
            ['a fractional', [10.37, 14.61] as [number, number]],
        ])('under %s translation', (_name, translation) => {
            it('paints what a whole repaint paints, frame after frame', () => {
                const { frame, wholeRepaint, first } = mount({ pixelRatio, translation });

                const moves = [
                    patch(25.1, 22.9, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)'),
                    patch(26.7, 23.3, 12.2, 8.1, 'rgba(220, 40, 60, 0.3)'),
                    patch(70.25, 40.75, 33.5, 20.5, 'rgba(10, 10, 10, 0.7)'),
                ];
                for (const move of moves) {
                    const { pixels, partial } = frame(() => first.update([move]));
                    expect(partial).toBe(true);
                    expectSamePixels(pixels, wholeRepaint());
                }
            });

            it('paints what a whole repaint paints when an edge reaches almost a device pixel past the region', () => {
                const { frame, wholeRepaint, first } = mount({ pixelRatio, translation, halo: 0.9 / pixelRatio });

                const { pixels, partial } = frame(() =>
                    first.update([patch(25.1, 22.9, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)')])
                );

                expect(partial).toBe(true);
                expectSamePixels(pixels, wholeRepaint());
            });

            it('paints what a whole repaint paints when the regions of two nodes overlap', () => {
                const { frame, wholeRepaint, first, second } = mount({ pixelRatio, translation });

                const { pixels, partial } = frame(() => {
                    first.update([patch(30.5, 25.5, 28.5, 22.5, 'rgba(220, 40, 60, 0.6)')]);
                    second.update([patch(44.2, 33.3, 28.7, 20.1, 'rgba(30, 160, 80, 0.6)')]);
                });

                expect(partial).toBe(true);
                expectSamePixels(pixels, wholeRepaint());
            });

            it('paints what a whole repaint paints when the node is in a layer within the layer', () => {
                const { frame, wholeRepaint, third, first } = mount({ pixelRatio, translation, nested: true });

                const inner = frame(() => third.update([patch(112.25, 62.5, 18.5, 22.5, 'rgba(120, 40, 200, 0.6)')]));
                expect(inner.partial).toBe(true);
                expectSamePixels(inner.pixels, wholeRepaint());

                const outer = frame(() => first.update([patch(24.5, 24.5, 30.5, 25.5, 'rgba(220, 40, 60, 0.6)')]));
                expect(outer.partial).toBe(true);
                expectSamePixels(outer.pixels, wholeRepaint());
            });
        });

        describe('when a frame must repaint the layer whole', () => {
            const translation: [number, number] = [10.37, 14.61];

            it('paints what a whole repaint paints after an ordinary markDirty in the same frame', () => {
                const { frame, wholeRepaint, first, layer } = mount({ pixelRatio, translation });

                const { pixels, partial } = frame(() => {
                    first.update([patch(25.1, 22.9, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)')]);
                    layer.markDirty();
                });

                expect(partial).toBe(false);
                expectSamePixels(pixels, wholeRepaint());
            });

            it('paints what a whole repaint paints after the layer is resized', () => {
                const { scene, frame, wholeRepaint, first } = mount({ pixelRatio, translation });

                const { pixels, partial } = frame(() => {
                    scene.resize(WIDTH + 20, HEIGHT + 10, pixelRatio);
                    first.update([patch(25.1, 22.9, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)')]);
                });

                expect(partial).toBe(false);
                expectSamePixels(pixels, wholeRepaint());
            });

            it('paints what a whole repaint paints after the pixel ratio changes', () => {
                const { scene, frame, wholeRepaint, first } = mount({ pixelRatio, translation });

                const { pixels, partial } = frame(() => {
                    scene.resize(WIDTH, HEIGHT, pixelRatio === 2 ? 1 : 2);
                    first.update([patch(25.1, 22.9, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)')]);
                });

                expect(partial).toBe(false);
                expectSamePixels(pixels, wholeRepaint());
            });

            it('paints what a whole repaint paints after the layer moves', () => {
                const { frame, wholeRepaint, first, shifted } = mount({ pixelRatio, translation });

                const { pixels, partial } = frame(() => {
                    shifted.translationX += 3.4;
                    first.update([patch(25.1, 22.9, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)')]);
                });

                expect(partial).toBe(false);
                expectSamePixels(pixels, wholeRepaint());
            });

            it('paints what a whole repaint paints after a render error, and then repaints in part again', () => {
                const { frame, wholeRepaint, first } = mount({ pixelRatio, translation });
                first.failNextRender = true;
                // The error is logged, and the frame goes on without the node.
                frame(() => first.update([patch(25.1, 22.9, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)')]));
                expect(console.warn).toHaveBeenCalledTimes(1);
                vi.mocked(console.warn).mockClear();

                const recovered = frame(() => first.update([patch(26.1, 23.9, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)')]));
                expect(recovered.partial).toBe(false);
                expectSamePixels(recovered.pixels, wholeRepaint());

                const next = frame(() => first.update([patch(27.1, 24.9, 30.4, 25.2, 'rgba(220, 40, 60, 0.6)')]));
                expect(next.partial).toBe(true);
                expectSamePixels(next.pixels, wholeRepaint());
            });
        });
    });
});
