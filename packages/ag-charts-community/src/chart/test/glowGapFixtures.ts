import { afterEach } from 'vitest';

import { Group, Scene, TranslatableGroup } from 'ag-charts-core';
import type { NormalisedDropShadowOptions, Shape } from 'ag-charts-core';

import { setupMockConsole } from '../../util/test/mockConsole';
import type { Pixel } from '../../util/test/shadowPixels';

/** The size of the canvas that {@link useGlowScenes} draws on, which a test sets the mock canvas up with. */
export const GLOW_SCENE_SIZE = { width: 400, height: 220 };

/** The centre of the shapes of the glow gap tests, and the right edge of each of them, 60 across. */
export const GLOW_CENTRE = { x: 200, y: 110 };
export const GLOW_RIGHT_EDGE = 230;

/** How a glow is cast: by a shadow root, by the group that batches it, or by an item that erases the layer beneath it. */
export type GlowRoute = 'root' | 'group' | 'cutout';
export const GLOW_ROUTES: readonly GlowRoute[] = ['root', 'group', 'cutout'];

/** A route for a shadow: {@link GlowRoute}, or `self`, where no root or group batches it and the item casts its own. */
export type ShadowRoute = GlowRoute | 'self';

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

/** A fill that is transparent at the left of an item and opaque at the right, which an ungapped glow follows. */
export const FADING = {
    type: 'gradient' as const,
    gradient: 'linear' as const,
    rotation: 90,
    colorStops: [
        { color: 'rgba(0, 0, 255, 0)', stop: 0 },
        { color: 'rgba(0, 0, 255, 1)', stop: 1 },
    ],
};

/** Distances from the right edge of an item, in pixels, along the line across its centre, for a glow with a spread of 10. */
export const GLOW_PROBES = { inside: -15, near: 2, middle: 7, outer: 13, past: 20 };

/** What a pixel that nothing was drawn on reads as. */
export const CLEAR: Pixel = [0, 0, 0, 0];

/** The red, green and blue of {@link TRANSLUCENT_BLUE} drawn on a clear layer, as it is where no glow shows through it. */
export const BLUE_RGB = [0, 0, 255];

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

    const draw = (route: ShadowRoute, highlight: boolean, items: Shape[]) => {
        const parent = new Group({
            name: 'items',
            batchShadows: route === 'self' ? false : 'shared',
            holdsHighlight: highlight,
        });
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

        const pixelAt = (x: number, y: number): Pixel =>
            Array.from(scene.canvas.context.getImageData(x, y, 1, 1).data as ArrayLike<number>);
        return {
            pixelAt,
            /** The pixel `distance` past the right edge of the item at the centre, which is inside it if that is negative. */
            at: (distance: number) => pixelAt(GLOW_RIGHT_EDGE + distance, GLOW_CENTRE.y),
        };
    };

    return Object.assign((route: ShadowRoute, ...items: Shape[]) => draw(route, false, items), {
        /** Draws the items as the highlight copies of hovered items, in a group that holds them. */
        hovered: (route: ShadowRoute, ...items: Shape[]) => draw(route, true, items),
    });
}

/** A stretch of pixels of one class, going along a column or a row. */
export interface PixelRun {
    class: string;
    length: number;
}

/** Groups consecutive pixels of the same class into runs, which is how the layers of a glow read going out from an item. */
export function classRuns(classes: Iterable<string>): PixelRun[] {
    const runs: PixelRun[] = [];
    for (const pixelClass of classes) {
        const last = runs.at(-1);
        if (last?.class === pixelClass) last.length++;
        else runs.push({ class: pixelClass, length: 1 });
    }
    return runs;
}

/** A rectangle of pixels, with each edge included. */
export interface PixelWindow {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

/** The distance from each pixel of a red glow in the window to the nearest pixel that the item paints, which is found without the glow. */
export function glowDistances(
    bare: (x: number, y: number) => Pixel,
    glowing: (x: number, y: number) => Pixel,
    { left, right, top, bottom }: PixelWindow
): number[] {
    const isPainted = (x: number, y: number) => bare(x, y)[3] >= 128;
    const edge: [number, number][] = [];
    const glow: [number, number][] = [];
    for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
            if (!isPainted(x, y)) {
                if (glowing(x, y)[0] > 0) glow.push([x, y]);
            } else if (!isPainted(x - 1, y) || !isPainted(x + 1, y) || !isPainted(x, y - 1) || !isPainted(x, y + 1)) {
                // Only a pixel on the edge of the item can be the nearest to a pixel outside it.
                edge.push([x, y]);
            }
        }
    }
    return glow.map(([x, y]) => Math.sqrt(Math.min(...edge.map(([px, py]) => (x - px) ** 2 + (y - py) ** 2))));
}
