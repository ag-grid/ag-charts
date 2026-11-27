import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Group } from './group';
import type { RenderContext } from './node';
import type { CollectedFrame } from './shadowCollector';
import { overrideTintableShadows } from './shadowColour';
import type { ShadowCast } from './shadowEngine';
import { castGlowOverlay, releaseShadowRoot } from './shadowRoot';
import { Rect } from './shape/rect';

const engine = vi.hoisted(() => ({ casts: [] as ShadowCast[], joins: 0 }));

// The engine's cast needs a canvas, and what is tested is which keys the root hands it, so the cast only records them.
vi.mock('./shadowEngine', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./shadowEngine')>();
    return {
        ...actual,
        castShadows: (cast: ShadowCast) => {
            engine.casts.push(cast);
            return true;
        },
        joinsShadowKey: (...args: Parameters<typeof actual.joinsShadowKey>) => {
            engine.joins++;
            return actual.joinsShadowKey(...args);
        },
    };
});

const GLOW = { enabled: true, xOffset: 0, yOffset: 0, blur: 0, spread: 8, fillOpacity: 1, glow: true as const };

describe('shadow root keys', () => {
    const user = {};
    const renderCtx = {} as RenderContext;

    beforeEach(() => {
        engine.casts = [];
        engine.joins = 0;
        // Only constructed: nothing here draws or measures a path.
        vi.stubGlobal('Path2D', class {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        releaseShadowRoot(undefined, user);
        overrideTintableShadows();
    });

    /** One group per item, each in a frame of its own, as the series that cast through a root are. */
    const frames = (fills: readonly string[]) =>
        fills.map((fill, i) => {
            const rect = new Rect();
            Object.assign(rect, { x: i * 10, y: 0, width: 8, height: 8, fill, fillGlow: GLOW });
            const source = new Group({ name: `series-${i}`, batchShadows: 'shared' });
            source.appendChild(rect);
            const frame: CollectedFrame<Group> = {
                source,
                version: 0,
                matrix: [1, 0, 0, 1, 0, 0],
                alpha: 1,
                clips: [],
                layered: false,
                glowsOnly: false,
                cutsOnly: false,
                owner: undefined,
                ownCuts: false,
                groupedCuts: false,
                hovered: false,
            };
            return { rect, frame };
        });

    const castOverlay = (items: ReturnType<typeof frames>) => {
        expect(
            castGlowOverlay(
                items.map(({ frame }) => frame),
                undefined,
                user,
                renderCtx
            )
        ).toBe(true);
        expect(engine.casts).toHaveLength(1);
        return engine.casts[0].keys;
    };

    describe('where the canvas cannot blur a mask of many colours', () => {
        beforeEach(() => overrideTintableShadows(false));

        it('should make a key for each colour, in the order of the first item of each, with the items of that colour', () => {
            const fills = ['red', 'green', 'red', 'blue', 'green', 'red', 'blue'];
            const items = frames(fills);

            const keys = castOverlay(items);

            const colours = [...new Set(fills)];
            expect(keys).toHaveLength(colours.length);
            for (const [i, key] of keys.entries()) {
                const expected = items.filter((_, item) => fills[item] === colours[i]);
                expect(key.casters).toEqual(expected.map(({ rect }) => rect));
                expect(key.frames).toEqual(expected.map(({ frame }) => frame));
            }
        });

        it('should find the key of an item without comparing it to every key, however many colours the items have', () => {
            const colours = Array.from({ length: 60 }, (_, i) => `rgb(${i}, ${255 - i}, 0)`);
            // Every colour twice, so that each item of the second pass has a key to find, after all the others were made.
            const items = frames([...colours, ...colours]);

            const keys = castOverlay(items);

            expect(keys).toHaveLength(colours.length);
            expect(keys.every((key) => key.casters.length === 2)).toBe(true);
            // Comparing each item to each key before it would take about 3600.
            expect(engine.joins).toBeLessThanOrEqual(items.length);
        });
    });

    it('should make one key for the glows of every colour where the canvas can blur them', () => {
        overrideTintableShadows(true);

        const keys = castOverlay(frames(['red', 'green', 'blue', 'red']));

        expect(keys).toHaveLength(1);
        expect(keys[0].casters).toHaveLength(4);
    });
});
