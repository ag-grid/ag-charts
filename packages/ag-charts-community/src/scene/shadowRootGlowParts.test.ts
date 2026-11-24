import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Group, Rect, Scene, TranslatableGroup, shadowPass } from 'ag-charts-core';
import type { RenderContext } from 'ag-charts-core';

import { differingBytes, expectSamePixels } from '../chart/test/expectSamePixels';
import { setupMockCanvas } from '../util/test/mockCanvas';

const WIDTH = 400;
const HEIGHT = 220;

/** Enough casters in the glows of one key for the overlay to cast them by the strength that they cast at, in parts. */
const BULK = 540;
const FEW = 20;

const GLOW = {
    enabled: true,
    fill: 'rgb(0, 0, 255)',
    fillOpacity: 0.6,
    xOffset: 0,
    yOffset: 0,
    blur: 6,
    glow: true as const,
};

interface Layout {
    /** The opacity of the items of each key that casts BULK of them. */
    keys: number[];
    /** The size of the layer, which a key's glow reaches most of. */
    size?: { width: number; height: number };
    /** Casters in a key of too few for a part, below the others. */
    few?: boolean;
}

describe('the parts of the glow overlay', () => {
    const mockCanvas = setupMockCanvas({ width: WIDTH, height: HEIGHT });

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

    /** Items at one opacity, in rows from `top`, which overlap those of the other keys, whose glows share one key as they cast the same. */
    const items = (count: number, top: number, opacity: number, size: Layout['size'], shift: number, glow: Partial<typeof GLOW> = GLOW) =>
        Array.from({ length: count }, (_, i) => {
            const item = new TestRect();
            const scale = size == null ? 1 : size.width / WIDTH;
            Object.assign(item, {
                x: (10 + (i % 60) * 6 + shift) * scale,
                y: (top + Math.floor(i / 60) * 6 + shift) * scale,
                width: 4 * scale,
                height: 4 * scale,
                fill: 'black',
                opacity,
                fillGlow: glow,
            });
            return item;
        });

    const chart = ({ keys, size, few }: Layout) => {
        const { width, height } = size ?? { width: WIDTH, height: HEIGHT };
        const bulk = keys.map((opacity, i) => items(BULK, 10, opacity, size, i * 2));
        const small = few === true ? items(FEW, 150, 1, size, 0, { ...GLOW, fill: 'rgb(255, 0, 0)' }) : [];
        const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
        for (const children of [...bulk, small]) {
            const group = new Group({ name: 'series', batchShadows: 'shared' });
            for (const child of children) group.appendChild(child);
            root.appendChild(group);
        }
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(width, height, 1);
        scene.setRoot(root);
        scenes.push(scene);
        scene.render();
        return { scene, bulk, small, root };
    };

    const pixelsOf = (scene: Scene) => {
        const { width, height } = scene.canvas;
        return Array.from(scene.canvas.context.getImageData(0, 0, width, height).data as ArrayLike<number>);
    };

    /** Draws again, and returns the items that drew a mask: those whose glow was cast, not drawn from a part kept. */
    const render = (scene: Scene) => {
        masked = [];
        scene.render();
        return masked;
    };

    const setOpacity = (casters: Rect[], opacity: number) => {
        for (const item of casters) item.opacity = opacity;
    };

    const live = () => mockCanvas.getActiveOffscreenCanvasInstances().filter((canvas) => canvas.width > 0);

    it('should draw the glow of the casters that two casts left as they were from the part that held it', () => {
        const { scene, bulk } = chart({ keys: [0.2, 0.2, 0.2] });
        const [changing, ...others] = bulk;

        // The part that two casts in a row sign alike is kept by the second, and drawn by the third. The changing one sorts first.
        setOpacity(changing, 0.4);
        render(scene);
        setOpacity(changing, 0.6);
        const kept = render(scene);
        expect(others.flat().every((item) => kept.includes(item))).toBe(true);

        setOpacity(changing, 0.8);
        const drawn = render(scene);

        expect(drawn).toHaveLength(BULK);
        expect(changing.every((item) => drawn.includes(item))).toBe(true);
    });

    it('should draw the parts that a cast that repeats kept, and not cast them again once a change leaves them as they were', () => {
        const { scene, bulk, root } = chart({ keys: [0.2, 0.2] });
        setOpacity(bulk[0], 0.4);
        render(scene);
        for (let repeat = 0; repeat < 2; repeat++) {
            root.markDirty();
            render(scene);
        }

        setOpacity(bulk[0], 0.6);
        const cast = render(scene);

        expect(cast).toHaveLength(BULK);
        expect(bulk[0].every((item) => cast.includes(item))).toBe(true);
    });

    it('should draw the glows that it draws from a part as a chart in that state draws them', () => {
        const { scene, bulk } = chart({ keys: [0.2, 0.2, 0.2] });
        for (const opacity of [0.4, 0.6, 0.8]) {
            setOpacity(bulk[0], opacity);
            render(scene);
        }
        expect(pixelsOf(scene).some((value) => value !== 0)).toBe(true);

        expectSamePixels({ data: pixelsOf(scene) }, { data: pixelsOf(chart({ keys: [0.8, 0.2, 0.2] }).scene) });
    });

    it('should draw the glows as a chart in that state draws them when the scene keeps no room for a part', () => {
        // Each key's glow reaches most of a layer of 2000 x 2000, so that two parts fill the budget and the third has no room.
        const size = { width: 2000, height: 2000 };
        const { scene, bulk } = chart({ keys: [0.2, 0.3, 0.4, 0.5], size });
        for (const opacity of [0.6, 0.7, 0.8]) {
            setOpacity(bulk[0], opacity);
            render(scene);
        }

        expectSamePixels(
            { data: pixelsOf(scene) },
            { data: pixelsOf(chart({ keys: [0.8, 0.3, 0.4, 0.5], size }).scene) }
        );
    });

    it('should draw the glow of a caster that moves, beside the part that it was in', () => {
        const { scene, bulk } = chart({ keys: [0.2, 0.2] });
        setOpacity(bulk[0], 0.4);
        render(scene);
        bulk[1][3].x += 40;
        render(scene);

        const fresh = chart({ keys: [0.4, 0.2] });
        fresh.bulk[1][3].x += 40;
        render(fresh.scene);
        expectSamePixels({ data: pixelsOf(scene) }, { data: pixelsOf(fresh.scene) });
    });

    it('should draw a part again, as it was, after the chart returns to its state', () => {
        const { scene, bulk } = chart({ keys: [0.2, 0.2] });
        const before = pixelsOf(scene);
        setOpacity(bulk[0], 0.6);
        render(scene);
        setOpacity(bulk[0], 0.2);
        render(scene);

        expectSamePixels({ data: pixelsOf(scene) }, { data: before });
    });

    it('should cast a key of too few casters for a part on every cast', () => {
        const { scene, bulk, small } = chart({ keys: [0.2, 0.2], few: true });
        for (const opacity of [0.4, 0.6]) {
            setOpacity(bulk[0], opacity);
            render(scene);
        }
        setOpacity(bulk[0], 0.8);
        const cast = render(scene);

        expect(small.every((item) => cast.includes(item))).toBe(true);
        expect(bulk[1].some((item) => cast.includes(item))).toBe(false);
    });

    /** Two groups of casters, each below the count of a part, drawn as one key if `joined` and as a key of its own otherwise. */
    const twoGroups = (opacities: [number, number], tops: [number, number], joined: boolean, glow: Partial<typeof GLOW> = GLOW) => {
        const root = new TranslatableGroup({ name: 'root', shadowRoot: true });
        for (const [i, opacity] of opacities.entries()) {
            const group = new Group({ name: 'series', batchShadows: 'shared' });
            // A glow that `selfCut` says is not cut by itself casts as one that does not, but it is a key of its own.
            const own = joined || i === 0 ? glow : { ...glow, selfCut: false };
            for (const item of items(BULK / 2, tops[i], opacity, undefined, i * 2, own)) group.appendChild(item);
            root.appendChild(group);
        }
        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
        scene.resize(WIDTH, HEIGHT, 1);
        scene.setRoot(root);
        scenes.push(scene);
        scene.render();
        return pixelsOf(scene);
    };

    const { fill: _fill, ...TINTED } = GLOW;

    it('should draw the overlapping filled glows of a key of many casters within 2 levels of blurring each onto the canvas', () => {
        const parts = twoGroups([0.3, 0.7], [10, 10], true);
        const direct = twoGroups([0.3, 0.7], [10, 10], false);

        expect(parts.some((value) => value !== 0)).toBe(true);
        expect(differingBytes({ data: parts }, { data: direct }, 2)).toBe(0);
    });

    it('should draw the tinted glows of a key of many casters as blurring each onto the canvas draws them', () => {
        const parts = twoGroups([0.3, 0.7], [10, 10], true, TINTED);
        const direct = twoGroups([0.3, 0.7], [10, 10], false, TINTED);

        expect(parts.some((value) => value !== 0)).toBe(true);
        expectSamePixels({ data: parts }, { data: direct });
    });

    it('should draw the glow of a part that lands on an empty canvas as blurring it onto the canvas draws it', () => {
        const parts = twoGroups([0.3, 0.7], [10, 150], true);
        const direct = twoGroups([0.3, 0.7], [10, 150], false);

        expect(parts.some((value) => value !== 0)).toBe(true);
        expectSamePixels({ data: parts }, { data: direct });
    });

    it('should keep no canvas for the parts of casts that change every frame', () => {
        const animated = chart({ keys: [0.2, 0.2, 0.2] });
        for (let frame = 0; frame < 6; frame++) {
            for (const [i, casters] of animated.bulk.entries()) setOpacity(casters, 0.2 + ((frame + i) % 5) * 0.1);
            render(animated.scene);
        }
        const canvases = live().length;

        // The canvases that a cast of keys of too few casters for parts holds, and the one that the parts are blurred on.
        scenes.pop()?.destroy();
        const unkept = chart({ keys: [0.2, 0.2, 0.2], few: true });
        expect(unkept.small).toHaveLength(FEW);
        expect(canvases).toBeLessThanOrEqual(live().length + 1);
    });
});
