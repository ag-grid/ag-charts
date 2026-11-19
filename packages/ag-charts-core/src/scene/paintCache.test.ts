import { describe, expect, it, vi } from 'vitest';

import { Logger } from '../logging/logger';
import { BBox } from './bbox';
import { LinearGradient } from './gradient/linearGradient';
import { Image } from './image/image';
import type { Node } from './node';

type FakeContext = Record<'createPattern' | 'createLinearGradient', ReturnType<typeof vi.fn>>;

const fakeContext = (): FakeContext => ({
    createPattern: vi.fn(() => ({})),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
});

const logger = new Logger();
const node = {} as Node;

type Painter = (ctx: CanvasRenderingContext2D, changed: boolean) => unknown;

// A shadow mask and its layer paint the same fill in two contexts by turns. Each context keeps its own entry, so the paint is built
// once for each, and not on every switch. What a paint builds shows in the calls it makes on the context it is given. Patterns are
// covered with the scene tests of the community package, as drawing their tile needs a canvas.
const CASES: { name: string; built: keyof FakeContext; key: string; make: () => Painter }[] = [
    {
        name: 'Gradient',
        built: 'createLinearGradient',
        key: 'bbox',
        make: () => {
            const stops = [
                { stop: 0, color: 'red' },
                { stop: 1, color: 'blue' },
            ];
            const gradient = new LinearGradient('rgb', stops);
            return (ctx, changed) => gradient.createGradient(ctx, new BBox(changed ? 5 : 0, 0, 20, 40));
        },
    },
    {
        name: 'Image',
        built: 'createPattern',
        key: 'size',
        make: () => {
            const loader = { loadImage: () => ({ width: 8, height: 8 }) };
            const image = new Image(loader as never, { url: 'a.png' } as never);
            return (ctx, changed) => image.createPattern(ctx, changed ? 20 : 10, 10, node, logger);
        },
    },
];

describe.each(CASES)('$name cache', ({ built, key, make }) => {
    const builds = (...contexts: FakeContext[]) =>
        contexts.reduce((total, ctx) => total + ctx[built].mock.calls.length, 0);

    it('should build once per context', () => {
        const paint = make();
        const [a, b] = [fakeContext(), fakeContext()];
        const [ctxA, ctxB] = [a, b] as unknown as CanvasRenderingContext2D[];

        const first = [paint(ctxA, false), paint(ctxB, false)];
        for (let i = 0; i < 3; i++) {
            expect(paint(ctxA, false)).toBe(first[0]);
            expect(paint(ctxB, false)).toBe(first[1]);
        }

        expect(first[0]).not.toBe(first[1]);
        expect(a[built]).toHaveBeenCalledTimes(1);
        expect(b[built]).toHaveBeenCalledTimes(1);
    });

    it(`should rebuild for a context when the ${key} changes`, () => {
        const paint = make();
        const ctx = fakeContext();

        paint(ctx as unknown as CanvasRenderingContext2D, false);
        paint(ctx as unknown as CanvasRenderingContext2D, true);
        paint(ctx as unknown as CanvasRenderingContext2D, true);

        expect(builds(ctx)).toBe(2);
    });
});
