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

describe('Group', () => {
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
