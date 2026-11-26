import { describe, expect, it } from 'vitest';

import type { Shape } from 'ag-charts-core';

import { Marker } from '../chart/marker/marker';
import {
    FADING,
    GLOW_CENTRE,
    GLOW_SCENE_SIZE,
    TRANSLUCENT_BLUE,
    redGlow,
    useGlowScenes,
} from '../chart/test/glowGapFixtures';
import { setupMockCanvas } from '../util/test/mockCanvas';

// The same render differs by 1/255 between hosts, so a pin of bytes holds within 2, which the regressions it guards exceed.
const PIN_TOLERANCE = 2;

const RADIUS = 30;
const ROWS = Array.from({ length: 91 }, (_, i) => GLOW_CENTRE.y - 45 + i);
const COLUMNS = Array.from({ length: 91 }, (_, i) => GLOW_CENTRE.x - 45 + i);
/** The pixels of the window whose distance from the centre of the circle is `from` to `to`, which are the same on every render. */
const ringOf = (from: number, to: number) =>
    ROWS.flatMap((y) =>
        COLUMNS.filter((x) => {
            const distance = Math.hypot(x + 0.5 - GLOW_CENTRE.x, y + 0.5 - GLOW_CENTRE.y);
            return distance >= from && distance <= to;
        }).map((x): [number, number] => [x, y])
    );
const INSIDE = ringOf(0, RADIUS - 3);
const OUTSIDE = ringOf(RADIUS + 2, RADIUS + 15);
const EVERYWHERE = ringOf(0, Infinity);

/** A circle 60 across at the centre of the scene, whose edge is anti-aliased, with the glow `gap`. No scene glow has no `gap` today. */
const circle = (fill: Shape['fill'], gap?: number) => {
    const marker = Object.assign(new Marker(), { fill, stroke: undefined, strokeWidth: 0, fillGlow: redGlow(gap) });
    marker.setVisibilityAndPosition(true, 'circle', 60, GLOW_CENTRE);
    return marker;
};

describe('the glow of a hovered item with no gap', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    type Draw = ReturnType<typeof draw>;
    const region = ({ pixelAt }: Draw, pixels = EVERYWHERE) => pixels.flatMap(([x, y]) => pixelAt(x, y));
    const maxDifference = (a: number[], b: number[]) => Math.max(...a.map((value, i) => Math.abs(value - b[i])));

    // A glow that a group casts is beneath its items, and one that an item casts as a cutout is beneath it too.
    describe.each(['group', 'cutout'] as const)('cast by the %s', (route) => {
        const seeThrough = [
            ['a translucent colour', TRANSLUCENT_BLUE],
            ['a solid fill that has its own fillOpacity', { type: 'solid', fill: 'blue', fillOpacity: 0.5 }],
            ['a gradient that fades to transparent', FADING],
        ] as [string, Shape['fill']][];

        it.each(seeThrough)(
            'should clear the footprint of an item with %s of the glow, and leave the glow beside it',
            (_name, fill) => {
                const cut = draw.hovered(route, circle(fill));
                const noGlow = draw.hovered(route, Object.assign(circle(fill), { fillGlow: undefined }));
                const atRest = draw(route, circle(fill));

                expect(maxDifference(region(cut, INSIDE), region(noGlow, INSIDE))).toBeLessThanOrEqual(PIN_TOLERANCE);
                expect(maxDifference(region(cut, OUTSIDE), region(atRest, OUTSIDE))).toBeLessThanOrEqual(PIN_TOLERANCE);
                // Nothing cuts the glow at rest in the same group, so it shows through the item there.
                expect(maxDifference(region(atRest, INSIDE), region(noGlow, INSIDE))).toBeGreaterThan(PIN_TOLERANCE);
            }
        );

        it('should leave an opaque item as it is, to its edge', () => {
            const opaque = 'rgb(0, 0, 255)';
            const hovered = region(draw.hovered(route, circle(opaque)));
            const atRest = region(draw(route, circle(opaque)));

            expect(maxDifference(hovered, atRest)).toBeLessThanOrEqual(PIN_TOLERANCE);
        });
    });
});
