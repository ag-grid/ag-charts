import { expect } from 'vitest';

import { type Sector, Transformable } from 'ag-charts-core';

import { chartPixelAt } from './utils';

type Chart = Parameters<typeof chartPixelAt>[0];

/** Where two sectors of a ring that meet on a line are read, by index into the sectors that were given. */
export interface SectorJoin {
    shorter: number;
    taller: number;
    /** Beyond the outer edge of the shorter sector, 3px from the line on its side: where its own glow ends. */
    band: number[];
    /** A further `3px` past the glow of the shorter sector, 3px from the line on its side: where the taller one wraps. */
    wrap: number[];
    /** Inside the taller sector, 3px from the line, level with `band`. */
    body: number[];
}

const PROBE = 3;

/** An angle `distance` px along the arc at `radius`, which a point round the circle sits from the line at `angle`. */
const offsetAngle = (angle: number, radius: number, distance: number) => angle + distance / radius;

/**
 * Reads the pixels at each join of the ring of `sectors`, taken in order and round to the first, where the sector after
 * ends the angle that the one before starts at, modulo a turn. The sectors at a join must differ in outer radius by more
 * than `reach` plus the width of the probes, so that the taller one is still there where the shorter one's glow ends.
 */
export function sectorJoinPixels(chart: Chart, sectors: Sector[], reach: number): SectorJoin[] {
    const full = 2 * Math.PI;
    return sectors.map((before, i) => {
        const afterIndex = (i + 1) % sectors.length;
        const after = sectors[afterIndex];
        const apart = (((after.startAngle - before.endAngle) % full) + full) % full;
        if (Math.min(apart, full - apart) > 1e-6) {
            throw new Error(`Sectors ${i} and ${afterIndex} do not meet: ${before.endAngle} to ${after.startAngle}`);
        }

        const beforeIsShorter = before.outerRadius < after.outerRadius;
        const [shorter, taller] = beforeIsShorter ? [before, after] : [after, before];
        if (taller.outerRadius - shorter.outerRadius < reach + 2 * PROBE + 4) {
            throw new Error(`Sectors ${i} and ${afterIndex} are too near in radius to tell their glows apart`);
        }

        const line = before.endAngle;
        // The sign that puts a probe on the side of the line the sector is on.
        const side = (sector: Sector) => (sector === before ? -1 : 1);
        const { canvasX, canvasY } = Transformable.toCanvasPoint(shorter, shorter.centerX, shorter.centerY);
        const at = (radius: number, sector: Sector) => {
            const angle = offsetAngle(line, radius, side(sector) * PROBE);
            return chartPixelAt(chart, canvasX + radius * Math.cos(angle), canvasY + radius * Math.sin(angle));
        };

        const bandRadius = shorter.outerRadius + reach / 2;
        return {
            shorter: beforeIsShorter ? i : afterIndex,
            taller: beforeIsShorter ? afterIndex : i,
            band: at(bandRadius, shorter),
            wrap: at(shorter.outerRadius + reach + PROBE + 1, shorter),
            body: at(bandRadius, taller),
        };
    });
}

/**
 * Expects every join of the ring of `sectors` to show the glow of the shorter sector ending on the line, the glow of the
 * taller one wrapping round past it, and neither glow over the other sector, which shows `body`.
 */
export function expectSectorGlowJoins(
    chart: Chart,
    sectors: Sector[],
    reach: number,
    glows: number[][],
    body: number[]
): void {
    const joins = sectorJoinPixels(chart, sectors, reach);
    expect(joins).toHaveLength(sectors.length);
    for (const join of joins) {
        expect(join.band).toEqual(glows[join.shorter]);
        expect(join.wrap).toEqual(glows[join.taller]);
        expect(join.body).toEqual(body);
    }
}
