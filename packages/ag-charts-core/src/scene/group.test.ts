import { afterEach, describe, expect, it } from 'vitest';

import { Logger } from '../logging/logger';
import { BBox } from './bbox';
import type { HdpiOffscreenCanvas } from './canvas/hdpiOffscreenCanvas';
import { Group, TranslatableGroup } from './group';
import type { LayersManager } from './layersManager';
import { type IScene, Node, type RenderContext } from './node';
import { fake } from './test/sceneAccessors';

const sceneTestLogger = new Logger();

// Local to this file: core cannot import the shared test library, which depends on core.
afterEach(() => sceneTestLogger.reset());

class TestNode extends Node {
    protected override computeBBox(): BBox | undefined {
        return new BBox(0, 0, 10, 10);
    }
}

function createMockScene(): { scene: IScene; layersManager: MockLayersManager } {
    const layersManager = new MockLayersManager();
    const scene: IScene = {
        imageLoader: null!,
        layersManager: fake<LayersManager>(layersManager),
        isRtl: false,
    };
    return { scene, layersManager };
}

class MockLayersManager {
    private readonly layersMap = new Map<HdpiOffscreenCanvas, object>();

    get size() {
        return this.layersMap.size;
    }

    addLayer(_opts: { name?: string }): HdpiOffscreenCanvas {
        const mockCanvas = fake<HdpiOffscreenCanvas>({ destroy: () => {} });
        this.layersMap.set(mockCanvas, {});
        return mockCanvas;
    }

    removeLayer(canvas: HdpiOffscreenCanvas) {
        if (this.layersMap.has(canvas)) {
            this.layersMap.delete(canvas);
            canvas.destroy();
        }
    }
}

class FontTestNode extends Node {
    private readonly fontString: string;

    constructor(font: string) {
        super();
        this.fontString = font;
    }

    override resolveFont(): string | undefined {
        return this.fontString;
    }

    protected override computeBBox(): BBox | undefined {
        return new BBox(0, 0, 10, 10);
    }
}

describe('Group', () => {
    describe('dirty propagation for offscreen bitmap groups', () => {
        it('should mark offscreen-cached group dirty when a child calls markDirty()', () => {
            const group = new Group({
                name: 'titles',
                renderToOffscreenCanvas: true,
                optimizeForInfrequentRedraws: true,
            });
            const child = new TestNode();
            group.appendChild(child);

            // Simulate a completed render cycle by clearing the dirty flag
            group.dirty = false;

            // A child calling markDirty() should propagate up to the group,
            // invalidating the cached offscreen ImageBitmap
            child.markDirty();

            expect(group.dirty).toBe(true);
        });
    });

    describe('resolveFont() caching', () => {
        it('should cache resolved child font', () => {
            const group = new Group({ name: 'font-group' });
            const child = new FontTestNode('16px Arial');
            group.appendChild(child);

            const font1 = group.resolveFont();
            const font2 = group.resolveFont();
            expect(font1).toBe('16px Arial');
            expect(font2).toBe('16px Arial');
        });

        it('should invalidate cache when markDirty is called', () => {
            const group = new Group({ name: 'font-group' });
            const child = new FontTestNode('16px Arial');
            group.appendChild(child);

            // Initial resolve
            group.resolveFont();

            // Replace child with different font
            child.remove();
            const child2 = new FontTestNode('20px Helvetica');
            group.appendChild(child2);

            // markDirty is called by appendChild; cache should be invalidated
            expect(group.resolveFont()).toBe('20px Helvetica');
        });

        it('should return undefined for offscreen canvas group', () => {
            const group = new Group({ name: 'offscreen-group', renderToOffscreenCanvas: true });
            const child = new FontTestNode('16px Arial');
            group.appendChild(child);

            // Offscreen groups return undefined from resolveFont() so parent
            // canvas context is not affected
            expect(group.resolveFont()).toBeUndefined();
        });

        it('should return first child font found in mixed children', () => {
            const group = new Group({ name: 'mixed-group' });
            const noFont = new TestNode(); // resolveFont() returns undefined
            const withFont = new FontTestNode('14px sans-serif');
            group.append([noFont, withFont]);

            expect(group.resolveFont()).toBe('14px sans-serif');
        });
    });

    describe('setScene()', () => {
        describe('layer cleanup', () => {
            it('should remove layer from previous scene when detaching', () => {
                const { scene, layersManager } = createMockScene();
                const group = new Group({
                    name: 'test-group',
                    renderToOffscreenCanvas: true,
                });

                expect(layersManager.size).toBe(0);

                // Attach group to scene
                group.setScene(scene);
                expect(layersManager.size).toBe(0); // No layer yet, needs preRender

                // Create a render context and call preRender to trigger layer creation
                const renderCtx: RenderContext = {
                    ctx: fake<CanvasRenderingContext2D>({}),
                    direction: 'ltr',
                    width: 100,
                    height: 100,
                    devicePixelRatio: 1,
                    logger: sceneTestLogger,
                    debugNodes: {},
                };

                // Add a child node so the group has nonGroups > 0, which is required for layer creation
                const childNode = new TestNode();
                group.appendChild(childNode);

                // Mark group as dirty and call preRender to create the layer
                group.markDirty();
                group.preRender(renderCtx);

                expect(layersManager.size).toBe(1);

                // Detach group from scene - this should remove the layer
                group.setScene();

                expect(layersManager.size).toBe(0);
            });

            it('should remove layer from previous scene when moving to different scene', () => {
                const { scene: scene1, layersManager: layersManager1 } = createMockScene();
                const { scene: scene2, layersManager: layersManager2 } = createMockScene();
                const group = new Group({
                    name: 'test-group',
                    renderToOffscreenCanvas: true,
                });

                expect(layersManager1.size).toBe(0);
                expect(layersManager2.size).toBe(0);

                // Attach group to scene1
                group.setScene(scene1);

                const renderCtx: RenderContext = {
                    ctx: fake<CanvasRenderingContext2D>({}),
                    direction: 'ltr',
                    width: 100,
                    height: 100,
                    devicePixelRatio: 1,
                    logger: sceneTestLogger,
                    debugNodes: {},
                };

                const childNode = new TestNode();
                group.appendChild(childNode);
                group.markDirty();
                group.preRender(renderCtx);

                expect(layersManager1.size).toBe(1);
                expect(layersManager2.size).toBe(0);

                // Move group to scene2 - should remove layer from scene1
                group.setScene(scene2);

                expect(layersManager1.size).toBe(0);
                expect(layersManager2.size).toBe(0); // No layer in scene2 yet
            });

            it('should not remove layer when scene does not change', () => {
                const { scene, layersManager } = createMockScene();
                const group = new Group({
                    name: 'test-group',
                    renderToOffscreenCanvas: true,
                });

                group.setScene(scene);

                const renderCtx: RenderContext = {
                    ctx: fake<CanvasRenderingContext2D>({}),
                    direction: 'ltr',
                    width: 100,
                    height: 100,
                    devicePixelRatio: 1,
                    logger: sceneTestLogger,
                    debugNodes: {},
                };

                const childNode = new TestNode();
                group.appendChild(childNode);
                group.markDirty();
                group.preRender(renderCtx);

                expect(layersManager.size).toBe(1);

                // Call setScene with the same scene - should not remove layer
                group.setScene(scene);

                expect(layersManager.size).toBe(1);
            });
        });
    });

    describe('partial layer repaint', () => {
        const PIXEL_RATIO = 2;

        // jsdom has no DOMMatrix, and a layer reads no more of the transform than its elements.
        const matrix = (a: number, b: number, c: number, d: number, e: number, f: number) =>
            ({ a, b, c, d, e, f }) as DOMMatrix;

        /** A canvas context that records the calls that decide what a layer repaints. */
        class RecordingContext {
            readonly calls: string[] = [];
            direction: CanvasDirection = 'ltr';
            globalAlpha = 1;
            font = '';
            baseTransform = matrix(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
            save() {}
            transform() {}
            restore() {}
            resetTransform() {
                this.calls.push('resetTransform');
            }
            setTransform(...args: unknown[]) {
                this.calls.push(`setTransform(${args.length})`);
            }
            getTransform() {
                return this.baseTransform;
            }
            beginPath() {}
            rect(x: number, y: number, width: number, height: number) {
                this.calls.push(`rect(${x},${y},${width},${height})`);
            }
            clip() {
                this.calls.push('clip');
            }
            clearRect(x: number, y: number, width: number, height: number) {
                this.calls.push(`clearRect(${x},${y},${width},${height})`);
            }
            drawImage() {
                this.calls.push('drawImage');
            }
        }

        class RecordingLayer {
            readonly context = new RecordingContext();
            clears = 0;
            clear() {
                this.clears++;
            }
            drawImage(ctx: { drawImage: () => void }) {
                ctx.drawImage();
            }
            destroy() {}
        }

        class RegionNode extends Node {
            region: BBox | undefined = new BBox(10, 20, 30, 40);
            failNextRender = false;
            readonly paintedRegions: (BBox | undefined)[] = [];

            protected override computeBBox() {
                return new BBox(0, 0, 100, 100);
            }
            override getDirtyRegion() {
                return this.region;
            }
            override render(renderCtx: RenderContext) {
                this.paintedRegions.push(renderCtx.dirtyRegion);
                if (this.failNextRender) {
                    this.failNextRender = false;
                    throw new Error('render failure');
                }
                super.render(renderCtx);
            }
        }

        function setup(opts?: { width?: number; height?: number }) {
            const layers: RecordingLayer[] = [];
            const scene: IScene = {
                imageLoader: null!,
                layersManager: {
                    addLayer: () => {
                        const layer = new RecordingLayer();
                        layers.push(layer);
                        return layer;
                    },
                    removeLayer: () => {},
                } as any,
                isRtl: false,
            };
            const root = new Group({ name: 'root' });
            const layerGroup = new Group({ name: 'layer', renderToOffscreenCanvas: true });
            const inner = new Group({ name: 'inner' });
            const node = new RegionNode();
            root.appendChild(layerGroup);
            layerGroup.appendChild(inner);
            inner.appendChild(node);
            root.setScene(scene);

            const mainCtx = new RecordingContext();
            const stats = {
                opsPerformed: 0,
                opsSkipped: 0,
                nodesRendered: 0,
                nodesSkipped: 0,
                layersRendered: 0,
                layersPartiallyRendered: 0,
                layersSkipped: 0,
            };
            const renderCtx: RenderContext = {
                ctx: mainCtx as any,
                direction: 'ltr',
                width: opts?.width ?? 100,
                height: opts?.height ?? 100,
                devicePixelRatio: PIXEL_RATIO,
                logger: sceneTestLogger,
                debugNodes: {},
                stats,
            };
            /** Runs one frame, and reports what it did to the newest layer, or to the layer the frame created. */
            const frame = (changes?: () => void) => {
                changes?.();
                const callsBefore = new Map(layers.map((layer) => [layer, layer.context.calls.length]));
                const clearsBefore = new Map(layers.map((layer) => [layer, layer.clears]));
                const painted = node.paintedRegions.length;
                const partial = stats.layersPartiallyRendered;
                const rendered = stats.layersRendered;
                root.preRender(renderCtx);
                root.render(renderCtx);
                const layer = layers.at(-1);
                return {
                    repainted: stats.layersRendered > rendered,
                    partial: stats.layersPartiallyRendered > partial,
                    calls: layer?.context.calls.slice(callsBefore.get(layer) ?? 0) ?? [],
                    cleared: layer != null && layer.clears > (clearsBefore.get(layer) ?? 0),
                    painted: node.paintedRegions.slice(painted),
                };
            };
            return { root, layerGroup, inner, node, layers, renderCtx, mainCtx, frame };
        }

        // The region is 10,20 30x40 CSS px: scaled to 20,40 60x80 device px, then grown by 1 and rounded outwards.
        const REGION = 'clearRect(19,39,62,82)';

        it('paints the first frame, and a frame with no change, without repainting the layer partially', () => {
            const { frame } = setup();

            expect(frame()).toMatchObject({ repainted: true, partial: false, cleared: true });
            expect(frame()).toMatchObject({ repainted: false, partial: false });
        });

        it('repaints only the region of a node that marked its region dirty', () => {
            const { frame, node } = setup();
            frame();

            const result = frame(() => node.markDirtyRegion());

            expect(result.partial).toBe(true);
            expect(result.cleared).toBe(false);
            expect(result.calls).toEqual(['resetTransform', 'rect(19,39,62,82)', 'clip', REGION, 'setTransform(1)']);
            expect(result.painted).toEqual([new BBox(19, 39, 62, 82)]);
        });

        it('repaints the region after the next frame as well', () => {
            const { frame, node } = setup();
            frame();
            frame(() => node.markDirtyRegion());

            expect(frame(() => node.markDirtyRegion()).partial).toBe(true);
            expect(frame().repainted).toBe(false);
        });

        it('unions the regions of every node that marked one', () => {
            const { frame, node, inner } = setup();
            const other = new RegionNode();
            other.region = new BBox(40, 50, 10, 10);
            inner.appendChild(other);
            frame();

            const result = frame(() => {
                node.markDirtyRegion();
                other.markDirtyRegion();
            });

            // 10,20 to 50,60 CSS px, scaled and grown.
            expect(result.calls).toContain('clearRect(19,39,82,82)');
            expect(result.partial).toBe(true);
        });

        it('places the region of a node under a translated group', () => {
            const { frame, node, inner, layerGroup } = setup();
            const shifted = new (TranslatableGroup as any)({ name: 'shifted' }) as InstanceType<
                typeof TranslatableGroup
            >;
            inner.appendChild(shifted);
            node.remove();
            shifted.appendChild(node);
            shifted.translationX = 5.25;
            shifted.translationY = 7;
            frame();

            const result = frame(() => node.markDirtyRegion());

            // 15.25,27 CSS px is 30.5,54 device px, so 29 and 53 once grown and rounded outwards.
            expect(result.calls).toContain('clearRect(29,53,63,82)');
            expect(layerGroup.dirty).toBe(false);
        });

        describe('repaints the whole layer', () => {
            it('when an ordinary markDirty lands in the same frame', () => {
                const { frame, node, inner } = setup();
                frame();

                const result = frame(() => {
                    node.markDirtyRegion();
                    inner.markDirty();
                });

                expect(result).toMatchObject({ repainted: true, partial: false, cleared: true });
                expect(result.painted).toEqual([undefined]);
            });

            it('when the ordinary markDirty came first', () => {
                const { frame, node, inner } = setup();
                frame();

                const result = frame(() => {
                    inner.markDirty();
                    node.markDirtyRegion();
                });

                expect(result).toMatchObject({ partial: false, cleared: true });
            });

            it('when the layer is resized', () => {
                const { frame, node, renderCtx } = setup();
                frame();

                const result = frame(() => {
                    node.markDirtyRegion();
                    renderCtx.width = 120;
                });

                expect(result).toMatchObject({ partial: false, cleared: true });
            });

            it('when the pixel ratio changes', () => {
                const { frame, node, renderCtx } = setup();
                frame();

                const result = frame(() => {
                    node.markDirtyRegion();
                    renderCtx.devicePixelRatio = 1;
                    (renderCtx.ctx as any).baseTransform = matrix(1, 0, 0, 1, 0, 0);
                });

                expect(result).toMatchObject({ partial: false, cleared: true });
            });

            it('when the layer is new', () => {
                const { frame, node, layerGroup, root, layers } = setup();
                frame();
                layerGroup.setScene();
                layerGroup.setScene(root['scene']);

                const result = frame(() => node.markDirtyRegion());

                expect(layers).toHaveLength(2);
                expect(result).toMatchObject({ partial: false, repainted: true });
            });

            it('when the layer transform changed', () => {
                const { frame, node, mainCtx } = setup();
                frame();

                const result = frame(() => {
                    node.markDirtyRegion();
                    mainCtx.baseTransform = matrix(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 4, 0);
                });

                expect(result).toMatchObject({ partial: false, cleared: true });
            });

            it('when the layer transform is not a scale and a translation', () => {
                const { frame, node, mainCtx } = setup();
                mainCtx.baseTransform = matrix(PIXEL_RATIO, 1, -1, PIXEL_RATIO, 0, 0);
                frame();

                const result = frame(() => node.markDirtyRegion());

                expect(result).toMatchObject({ partial: false, cleared: true });
            });

            it('after a render error in the layer, and then partially again', () => {
                const { frame, node } = setup();
                frame();
                frame(() => {
                    node.failNextRender = true;
                    node.markDirtyRegion();
                });

                // The failed frame was a partial repaint, whose result can't be built on.
                expect(frame(() => node.markDirtyRegion())).toMatchObject({ partial: false, cleared: true });
                expect(frame(() => node.markDirtyRegion())).toMatchObject({ partial: true, cleared: false });
            });

            it('when the node reports no region, or an empty one', () => {
                const { frame, node } = setup();
                frame();

                node.region = undefined;
                expect(frame(() => node.markDirtyRegion())).toMatchObject({ partial: false, cleared: true });

                node.region = new BBox(10, 10, 0, 5);
                expect(frame(() => node.markDirtyRegion())).toMatchObject({ partial: false, cleared: true });
            });

            it('when the region lies outside the layer', () => {
                const { frame, node } = setup();
                frame();

                node.region = new BBox(500, 500, 10, 10);

                expect(frame(() => node.markDirtyRegion())).toMatchObject({ partial: false, cleared: true });
            });

            it('when the region covers most of the layer', () => {
                const { frame, node } = setup();
                frame();

                node.region = new BBox(0, 0, 100, 80);

                expect(frame(() => node.markDirtyRegion())).toMatchObject({ partial: false, cleared: true });
            });

            it('when the node is dirtied before it has a layer to repaint', () => {
                const { frame, node } = setup();

                expect(frame(() => node.markDirtyRegion())).toMatchObject({ partial: false, repainted: true });
            });
        });

        describe('batched updates', () => {
            it('keep a region mark made inside a batch', () => {
                const { frame, node, layerGroup } = setup();
                frame();

                const result = frame(() => layerGroup.batchedUpdate(() => node.markDirtyRegion()));

                expect(result).toMatchObject({ partial: true, cleared: false });
            });

            it('keep a region mark made inside a batch of an ancestor of the node', () => {
                const { frame, node, inner } = setup();
                frame();

                const result = frame(() => inner.batchedUpdate(() => node.markDirtyRegion()));

                expect(result).toMatchObject({ partial: true, cleared: false });
            });

            it('repaint the whole layer when the batch also holds an ordinary mark', () => {
                const { frame, node, inner } = setup();
                frame();

                const result = frame(() =>
                    inner.batchedUpdate(() => {
                        node.markDirtyRegion();
                        inner.markDirty();
                    })
                );

                expect(result).toMatchObject({ partial: false, cleared: true });
            });
        });

        describe('nested layers', () => {
            it('repaint the inner layer in part, and the outer layer whole', () => {
                const { frame, node, inner, layers } = setup();
                inner.renderToOffscreenCanvas = true;
                frame();
                expect(layers).toHaveLength(2);

                const result = frame(() => node.markDirtyRegion());

                // A layer is created after the layers inside it.
                const [innerLayer, outer] = layers;
                expect(innerLayer.context.calls).toContain(REGION);
                expect(innerLayer.clears).toBe(1);
                // The outer layer was repainted whole: it was cleared, and repainted with no region.
                expect(outer.context.calls.filter((call) => call.startsWith('clearRect'))).toEqual([]);
                expect(outer.clears).toBe(2);
                expect(result.partial).toBe(true);
            });
        });

        describe('groups that own no layer', () => {
            it('are marked dirty, so that the node is rendered, and repaint as before', () => {
                const { frame, node, layerGroup } = setup();
                layerGroup.renderToOffscreenCanvas = false;
                frame();

                const result = frame(() => node.markDirtyRegion());

                expect(layerGroup.dirty).toBe(false);
                expect(result.painted).toEqual([undefined]);
            });

            it('mark their parents dirty when a group draws to a bitmap instead of a layer', () => {
                const { node, inner, layerGroup } = setup();
                layerGroup.optimizeForInfrequentRedraws = true;
                layerGroup.dirty = false;

                node.markDirtyRegion();

                expect(inner.dirty).toBe(true);
                expect(layerGroup.dirty).toBe(true);
            });
        });
    });
});
