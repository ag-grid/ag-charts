import { describe, expect, it } from 'vitest';

import { BBox } from '../../scene/bbox';
import { AxisLabelSource } from './axisLabelSource';

describe('AxisLabelSource', () => {
    it('contributes axis label boxes as obstacles, measured against the series rect', () => {
        const source = new AxisLabelSource('axisLabels:x', (seriesRect) => [
            new BBox(110 - seriesRect.x, 220 - seriesRect.y, 30, 12),
        ]);

        expect(source.usesPlacedLabels).toBe(false);
        expect(source.getLabelObstacles(new BBox(100, 200, 400, 300))).toEqual([
            {
                kind: 'rect',
                box: { x: 10, y: 20, width: 30, height: 12 },
                category: 'axisLabel',
                sourceId: 'axisLabels:x',
            },
        ]);
    });
});
