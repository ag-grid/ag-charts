import { describe, expect, it } from 'vitest';

import { BBox } from '../../scene/bbox';
import { AxisLabelSource } from './axisLabelSource';

describe('AxisLabelSource', () => {
    it('contributes axis label boxes as obstacles in series-rect space', () => {
        const source = new AxisLabelSource('axisLabels:x', () => [new BBox(110, 220, 30, 12)]);

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
