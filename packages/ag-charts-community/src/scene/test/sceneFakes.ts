import type { Canvas } from 'skia-canvas';
import { expect } from 'vitest';

import type { IScene, ImageLoader, LayersManager, Text } from 'ag-charts-core';

// The scene objects below are used by nodes that read only a few members, so a test builds the members the node
// reads instead of the full collaborator (a layers manager owns real canvases, an image loader real network loads).

/** A layers manager whose canvas has the given dimensions; all a node reads from it when it only draws. */
export function fakeLayersManagerWithCanvas(canvas: {
    width?: number;
    height?: number;
    pixelRatio: number;
}): LayersManager {
    return { canvas } as unknown as LayersManager;
}

/** A scene that draws onto `canvas`, with layer calls that do nothing. */
export function fakeScene(canvas: Canvas): IScene {
    const layersManager = {
        debug: {},
        canvas,
        markDirty: () => {},
        addLayer: () => undefined,
        moveLayer: () => {},
        removeLayer: () => {},
    } as unknown as LayersManager;
    return { imageLoader: null!, layersManager, isRtl: false };
}

/** An image loader that resolves each URI to a preloaded image and never has anything left to load. */
export function fakeImageLoader(imagesByUri: Record<string, unknown>): ImageLoader {
    return {
        loadImage: (uri: string) => imagesByUri[uri],
        waitingToLoad: () => false,
        destroy: () => {},
        on: () => () => {},
        off: () => {},
        once: () => () => {},
        emit: () => {},
    } as unknown as ImageLoader;
}

// A rich-text `Text` lays its segments out as child `Text` nodes of a private group, which is not one of its children.
interface RichTextHost {
    richText?: { children(): Iterable<Text> };
}

/** The line nodes a rich-text `Text` laid its segments out into, in line order. */
export function getRichTextLines(node: Text): Text[] {
    const { richText } = node as unknown as RichTextHost;
    expect(richText, 'rich text group').toBeDefined();
    return [...richText!.children()];
}
