import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Group, Rect, Scene, TranslatableGroup, shadowPass } from 'ag-charts-core';
import type { RenderContext } from 'ag-charts-core';

import { expectSamePixels } from '../chart/test/expectSamePixels';
import { setupMockCanvas } from '../util/test/mockCanvas';

const WIDTH = 400;
const HEIGHT = 220;

/** Enough casters in the glows of one key for the overlay to cast them by the strength that they cast at, in parts. */
const BULK = 540;
const FEW = 20;

const GLOW = {
    enabled: true,
    fill: 'rgb(0, 0, 255)',
    fillOpacity: 1,
    xOffset: 0,
    yOffset: 0,
    blur: 6,
    glow: true as const,
};

describe('the parts of the glow overlay', () => {
    setupMockCanvas({ width: WIDTH, height: HEIGHT });

    const scenes: Scene[] = [];
    let masked: Rect[] = [];

    class TestRect extends Rect {
        override isolatedRender(renderCtx: RenderContext) {
            // A mask that erases a footprint draws too, but it draws the same whatever a part holds.
            if (shadowPass.state === 'mask' && shadowPass.erase == null) masked.push(this);
            return super.isolatedRender(renderCtx);
        }
    }

    beforeEach(() => {
        masked = [];
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        for (const scene of scenes.splice(0)) scene.destroy();
        vi.mocked(console.warn).mockRestore();
    });

    /** Items at one opacity, in rows from `top`, whose glows share one key as they cast the same glow. */
    const items = (count: number, top: number, opacity: number) =>
        Array.from({ length: count }, (_, i) => {
            const item = new TestRect();
            Object.assign(item, {
                x: 10 + (i % 60) * 6,
                y: top + Math.floor(i / 60) * 6,
                width: 4,
                height: 4,
                fill: 'black',
                opacity,
                fillGlow: GLOW,
            });
            return item;
        });

    const chart = (bulkOpacity = 0.2, fewOpacity = 1) => {
        const bulk = items(BULK, 10, bulkOpacity);
        const few = items(FEW, 150, fewOpacity);
        const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
        for (const children of [bulk, few]) {
            const group = new Group({ name: 'series', batchShadows: 'shared' });
            for (const child of children) group.appendChild(child);
            root.appendChild(group);
        }
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(WIDTH, HEIGHT, 1);
        scene.setRoot(root);
        scenes.push(scene);
        scene.render();
        return { scene, bulk, few };
    };

    const pixelsOf = (scene: Scene) =>
        Array.from(scene.canvas.context.getImageData(0, 0, WIDTH, HEIGHT).data as ArrayLike<number>);

    /** Draws again, and returns the items that drew a mask: those whose glow was cast, not drawn from a part kept. */
    const render = (scene: Scene) => {
        masked = [];
        scene.render();
        return masked;
    };

    it('should draw the glow of the casters that a change leaves as they were from the part that held it', () => {
        const { scene, few } = chart();
        expect(pixelsOf(scene).some((value) => value !== 0)).toBe(true);

        few[0].opacity = 0.6;
        const cast = render(scene);

        expect(cast.length).toBeGreaterThan(0);
        expect(cast.every((item) => few.includes(item))).toBe(true);
    });

    it('should draw the glows that it draws from a part as a chart in that state draws them', () => {
        const { scene, few } = chart();
        few[0].opacity = 0.6;
        render(scene);

        const fresh = chart(0.2, 1);
        fresh.few[0].opacity = 0.6;
        render(fresh.scene);

        expectSamePixels({ data: pixelsOf(scene) }, { data: pixelsOf(fresh.scene) });
    });

    it('should draw the glows again when the opacity of the casters of a part changes', () => {
        const { scene, bulk } = chart();
        for (const item of bulk) item.opacity = 0.6;
        const cast = render(scene);

        expect(bulk.every((item) => cast.includes(item))).toBe(true);
        expectSamePixels({ data: pixelsOf(scene) }, { data: pixelsOf(chart(0.6, 1).scene) });
    });

    it('should draw the glow of a caster that moves, beside the part that it was in', () => {
        const { scene, bulk } = chart();
        bulk[3].x += 40;
        render(scene);

        const fresh = chart();
        fresh.bulk[3].x += 40;
        render(fresh.scene);
        expectSamePixels({ data: pixelsOf(scene) }, { data: pixelsOf(fresh.scene) });
    });

    it('should draw a part again, as it was, after the chart returns to its state', () => {
        const { scene, few } = chart();
        const before = pixelsOf(scene);
        few[0].opacity = 0.6;
        render(scene);
        few[0].opacity = 1;
        render(scene);

        expectSamePixels({ data: pixelsOf(scene) }, { data: before });
    });

    it('should keep no part for a key of too few casters', () => {
        const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
        const group = new Group({ name: 'series', batchShadows: 'shared' });
        const few = items(FEW, 10, 1);
        for (const child of few) group.appendChild(child);
        root.appendChild(group);
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(WIDTH, HEIGHT, 1);
        scene.setRoot(root);
        scenes.push(scene);
        scene.render();

        few[0].opacity = 0.6;
        expect(render(scene)).toHaveLength(FEW);
    });
});
