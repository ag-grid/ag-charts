import { describe, expect, it } from 'vitest';

import { sectorLabelContainer } from '../geometry/barLabelGeometry';
import { isPointInSector } from '../scene/util/sector';
import { fitSectorLabelRect, sectorLabelRoom } from './sectorLabelFit';

const sector = (midAngle: number, halfSpan: number, innerRadius: number, outerRadius: number) => ({
    startAngle: midAngle - halfSpan,
    endAngle: midAngle + halfSpan,
    innerRadius,
    outerRadius,
});
const anchorAt = (radius: number, angle: number) => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });

describe('fitSectorLabelRect', () => {
    const cornersInSector = (rect: ReturnType<typeof fitSectorLabelRect>, s: Parameters<typeof isPointInSector>[2]) => {
        const hw = rect.width / 2;
        const hh = rect.height / 2;
        return [
            [rect.centerX - hw, rect.centerY - hh],
            [rect.centerX + hw, rect.centerY - hh],
            [rect.centerX + hw, rect.centerY + hh],
            [rect.centerX - hw, rect.centerY + hh],
        ].every(([x, y]) => isPointInSector(x, y, s));
    };

    it('recentres a tilted-wedge label off the bisector while keeping the box in the sector', () => {
        // A wedge whose bisector is neither horizontal nor vertical: a horizontal label is not symmetric about
        // it, so the placement must shift off the anchor to sit evenly in the wedge.
        const s = sector(-Math.PI / 3, Math.PI / 8, 40, 120);
        const anchor = anchorAt(85, -Math.PI / 3);
        const rect = fitSectorLabelRect(anchor, s, 14);
        expect(Math.hypot(rect.centerX - anchor.x, rect.centerY - anchor.y)).toBeGreaterThan(1);
        expect(cornersInSector(rect, s)).toBe(true);
    });

    it('keeps the size from sectorLabelContainer, only moving the centre', () => {
        const s = sector(Math.PI / 2, Math.PI / 6, 40, 120);
        const anchor = anchorAt(85, Math.PI / 2);
        const rect = fitSectorLabelRect(anchor, s, 14);
        const size = sectorLabelContainer(anchor, s, 14);
        expect(rect.width).toBeCloseTo(size.width);
        expect(rect.height).toBeCloseTo(size.height);
    });

    it('leaves an anchor at the centre unchanged', () => {
        const rect = fitSectorLabelRect({ x: 0, y: 0 }, sector(0, Math.PI / 4, 0, 120), 14);
        expect(rect).toMatchObject({ centerX: 0, centerY: 0, width: 0, height: 0 });
    });

    it('leaves a measured block on the anchor when the wedge holds it there', () => {
        const s = sector(-Math.PI / 3, Math.PI / 8, 40, 120);
        const anchor = anchorAt(85, -Math.PI / 3);
        const rect = fitSectorLabelRect(anchor, s, 14, { width: 20, height: 14 });
        expect(rect).toMatchObject({ centerX: anchor.x, centerY: anchor.y, anchored: true });
    });

    it('moves a measured block off the anchor only when the wedge cannot hold it there', () => {
        const s = sector(-Math.PI / 3, Math.PI / 8, 40, 120);
        const anchor = anchorAt(85, -Math.PI / 3);
        const rect = fitSectorLabelRect(anchor, s, 14, { width: 70, height: 42 });
        expect(rect.anchored).toBeUndefined();
        expect(Math.hypot(rect.centerX - anchor.x, rect.centerY - anchor.y)).toBeGreaterThan(1);
    });

    it('fits a multi-line label to the widest band, filling the wedge further out than the bisector', () => {
        // The closing sector's trailing radial edge is vertical, which caps a bisector-symmetric box, so a
        // tall label must instead span the wedge's true width furthest out, where the wedge is widest.
        const s = {
            startAngle: -Math.PI / 2 + 0.86 * 2 * Math.PI,
            endAngle: -Math.PI / 2 + 2 * Math.PI,
            innerRadius: 0,
            outerRadius: 280,
        };
        const mid = (s.startAngle + s.endAngle) / 2;
        const anchor = anchorAt(140, mid);
        const container = sectorLabelContainer(anchor, s, 16);
        const rect = fitSectorLabelRect(anchor, s, 16);
        // The box is multi-line (the branch under test), the placement spans more than the symmetric reach,
        // sits further from the chart centre than the bisector anchor, and still fits the wedge.
        expect(container.height).toBeGreaterThan(16 * 1.5);
        expect(rect.width).toBeGreaterThan(container.width);
        expect(Math.hypot(rect.centerX, rect.centerY)).toBeGreaterThan(Math.hypot(anchor.x, anchor.y));
        expect(cornersInSector(rect, s)).toBe(true);
    });
});

describe('sectorLabelRoom', () => {
    const s = sector(0, Math.PI / 6, 40, 160);
    const anchor = anchorAt(100, 0);

    it('admits a block the wedge does hold, since a bound that refused one would drop a fitting label', () => {
        const block = { width: 60, height: 28 };
        expect(fitSectorLabelRect(anchor, s, 14, block).anchored).toBe(true);
        const room = sectorLabelRoom(anchor, s, 14);
        expect(room.capacityAt(14)).toBeGreaterThanOrEqual(block.width);
        expect(room.area).toBeGreaterThanOrEqual(block.width * block.height);
    });

    it('holds fewer lines, and so less text, as the lines grow taller', () => {
        const room = sectorLabelRoom(anchor, s, 14);
        expect(room.capacityAt(28)).toBeLessThan(room.capacityAt(14));
    });
});
