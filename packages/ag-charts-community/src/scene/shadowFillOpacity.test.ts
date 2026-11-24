import { afterEach, describe, expect, it } from 'vitest';

import { Group, Rect, Scene, TranslatableGroup } from 'ag-charts-core';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { box } from '../util/test/shadowPixels';

const WIDTH = 300;
const HEIGHT = 160;

/** A glow or shadow drawn with no blur, so that the alpha of a pixel is the strength it is cast at. */
const GLOW = { enabled: true, xOffset: 0, yOffset: 0, blur: 0, spread: 8, glow: true as const };
const SHADOW = { enabled: true, fill: 'rgb(255, 0, 0)', xOffset: 70, yOffset: 0, blur: 0 };

describe('Glow and shadow strength under the fillOpacity of the item', () => {
    setupMockCanvas({ width: WIDTH, height: HEIGHT });

    const scenes: Scene[] = [];
    afterEach(() => {
        for (const scene of scenes.splice(0)) scene.destroy();
    });

    /** The alpha of the pixel at (x, y) after drawing `item` in a group that shares its shadows, with or without a root. */
    const alphaAt = (shadowRoot: boolean, item: () => Rect, x: number, y: number) => {
        const root = new TranslatableGroup({ name: 'root', shadowRoot });
        const group = new Group({ name: 'shared-group', batchShadows: 'shared' });
        group.appendChild(item());
        root.appendChild(group);
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(WIDTH, HEIGHT, 1);
        scene.setRoot(root);
        scenes.push(scene);
        scene.render();
        return Array.from(scene.canvas.context.getImageData(x, y, 1, 1).data as ArrayLike<number>)[3];
    };

    // The item is 60 square at 100, 40, so (96, 70) is in the spread of a glow, outside it, and (190, 70) in a shadow
    // that is offset by 70.
    const GLOW_PROBE = [96, 70] as const;
    const SHADOW_PROBE = [190, 70] as const;
    const item = (mixin: Partial<Rect>) => () => box(100, 40, 60, 60, { fill: 'rgb(0, 0, 255)', ...mixin });

    describe.each([true, false])('with a shadow root: %s', (shadowRoot) => {
        const glowAlpha = (mixin: Partial<Rect>) => alphaAt(shadowRoot, item(mixin), ...GLOW_PROBE);
        const shadowAlpha = (mixin: Partial<Rect>) => alphaAt(shadowRoot, item(mixin), ...SHADOW_PROBE);

        it('should cast a glow with a fillOpacity as set, whatever the fillOpacity of the item', () => {
            const glow = { ...GLOW, fill: 'rgb(0, 255, 0)', fillOpacity: 1 };

            expect(glowAlpha({ fillGlow: glow })).toBe(255);
            expect(glowAlpha({ fillGlow: glow, fillOpacity: 0.5 })).toBe(255);
        });

        it('should cast a glow in the colour of its item at its own fillOpacity, whatever the alpha of the fill', () => {
            const glow = { ...GLOW, fillOpacity: 0.4 };

            expect(glowAlpha({ fillGlow: glow, fillOpacity: 0.5 })).toBeCloseTo(102, -1);
            expect(glowAlpha({ fillGlow: glow, fill: 'rgba(0, 0, 255, 0.5)' })).toBeCloseTo(102, -1);
            expect(glowAlpha({ fillGlow: glow, fillOpacity: 0.5 })).toBe(glowAlpha({ fillGlow: glow }));
        });

        it('should fade a glow with the opacity of the item', () => {
            const glow = { ...GLOW, fill: 'rgb(0, 255, 0)', fillOpacity: 1 };

            expect(glowAlpha({ fillGlow: glow, opacity: 0.5 })).toBeCloseTo(128, -1);
            expect(glowAlpha({ fillGlow: glow, opacity: 0.5, fillOpacity: 0.5 })).toBeCloseTo(128, -1);
        });

        it('should cast a shadow with a set fillOpacity as set, whatever the fillOpacity of the item', () => {
            const shadow = { ...SHADOW, fillOpacity: 1, fillOpacitySet: true as const };

            expect(shadowAlpha({ fillShadow: shadow })).toBe(255);
            expect(shadowAlpha({ fillShadow: shadow, fillOpacity: 0.5 })).toBe(255);
            expect(shadowAlpha({ fillShadow: shadow, fillOpacity: 0.5, opacity: 0.5 })).toBeCloseTo(128, -1);
        });

        it('should cast a shadow with no set fillOpacity at its fillOpacity times that of the item', () => {
            const shadow = { ...SHADOW, fillOpacity: 0.5 };

            expect(shadowAlpha({ fillShadow: shadow })).toBeCloseTo(128, -1);
            expect(shadowAlpha({ fillShadow: shadow, fillOpacity: 0.5 })).toBeCloseTo(64, -1);
        });
    });
});
