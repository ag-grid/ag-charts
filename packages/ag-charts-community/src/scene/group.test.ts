import { describe, expect, it } from '@jest/globals';

import { BBox } from './bbox';
import type { HdpiOffscreenCanvas } from './canvas/hdpiOffscreenCanvas';
import { Group } from './group';
import { type IScene, Node, type RenderContext } from './node';

class TestNode extends Node {
    protected override computeBBox(): BBox | undefined {
        return new BBox(0, 0, 10, 10);
    }
}

function createMockScene(): { scene: IScene; layersManager: MockLayersManager } {
    const layersManager = new MockLayersManager();
    const scene: IScene = {
        imageLoader: null!,
        layersManager: layersManager as any,
        isRtl: false,
    };
    return { scene, layersManager };
}

class MockLayersManager {
    private readonly layersMap = new Map<HdpiOffscreenCanvas, any>();

    get size() {
        return this.layersMap.size;
    }

    addLayer(_opts: { name?: string }): HdpiOffscreenCanvas {
        const mockCanvas = {
            destroy: () => {},
        } as any;
        this.layersMap.set(mockCanvas, {});
        return mockCanvas;
    }

    removeLayer(canvas: HdpiOffscreenCanvas) {
        if (this.layersMap.has(canvas)) {
            this.layersMap.delete(canvas);
            if (canvas && typeof (canvas as any).destroy === 'function') {
                (canvas as any).destroy();
            }
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
                    ctx: {} as any,
                    direction: 'ltr',
                    width: 100,
                    height: 100,
                    devicePixelRatio: 1,
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
                group.setScene(undefined);

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
                    ctx: {} as any,
                    direction: 'ltr',
                    width: 100,
                    height: 100,
                    devicePixelRatio: 1,
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
                    ctx: {} as any,
                    direction: 'ltr',
                    width: 100,
                    height: 100,
                    devicePixelRatio: 1,
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
});
