import { afterEach } from 'vitest';

import { Group, Scene, TranslatableGroup } from 'ag-charts-core';
import type { NormalisedDropShadowOptions, Shape } from 'ag-charts-core';

import { setupMockConsole } from '../../util/test/mockConsole';

/** The size of the canvas that {@link useGlowScenes} draws on, which a test sets the mock canvas up with. */
export const GLOW_SCENE_SIZE = { width: 400, height: 220 };

/** The centre of the shapes of the glow gap tests, and the right edge of each of them, 60 across. */
export const GLOW_CENTRE = { x: 200, y: 110 };
export const GLOW_RIGHT_EDGE = 230;

/** How a glow is cast: by a shadow root, by the group that batches it, or by an item that erases the layer beneath it. */
export type GlowRoute = 'root' | 'group' | 'cutout';
export const GLOW_ROUTES: readonly GlowRoute[] = ['root', 'group', 'cutout'];

/** A glow of red with no blur, so that a pixel is in it or out of it, and no offset: it is cast around the item. */
export const redGlow = (gap?: number): NormalisedDropShadowOptions => ({
    enabled: true,
    fill: 'rgba(255, 0, 0, 1)',
    xOffset: 0,
    yOffset: 0,
    blur: 0,
    spread: 10,
    gap,
    glow: true,
});

/** Translucent, so that a glow beneath it shows through unless the footprint of the item is cut out of it. */
export const TRANSLUCENT_BLUE = 'rgba(0, 0, 255, 0.5)';

/** Distances from the right edge of an item, in pixels, along the line across its centre, for a glow with a spread of 10. */
export const GLOW_PROBES = { inside: -15, near: 2, middle: 7, outer: 13, past: 20 };

export type GlowPixel = number[];

/**
 * Draws items as a route casts their glow on a canvas of {@link GLOW_SCENE_SIZE}, and reads pixels from it. Call it in the body
 * of a `describe`, after `setupMockCanvas`: it destroys the scenes it drew after each test.
 */
export function useGlowScenes() {
    const scenes: Scene[] = [];

    setupMockConsole();

    afterEach(() => {
        for (const scene of scenes.splice(0)) scene.destroy();
    });

    return (route: GlowRoute, ...items: Shape[]) => {
        const parent = new Group({ name: 'items', batchShadows: 'shared' });
        for (const item of items) {
            if (route === 'cutout') item.drawingMode = 'cutout';
            parent.appendChild(item);
        }
        const root = new TranslatableGroup({ name: 'root', shadowRoot: route === 'root' });
        root.appendChild(parent);
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(GLOW_SCENE_SIZE.width, GLOW_SCENE_SIZE.height, 1);
        scene.setRoot(root);
        scenes.push(scene);
        scene.render();

        const pixelAt = (x: number, y: number): GlowPixel =>
            Array.from(scene.canvas.context.getImageData(x, y, 1, 1).data as ArrayLike<number>);
        return {
            pixelAt,
            /** The pixel `distance` past the right edge of the item at the centre, which is inside it if that is negative. */
            at: (distance: number) => pixelAt(GLOW_RIGHT_EDGE + distance, GLOW_CENTRE.y),
        };
    };
}
