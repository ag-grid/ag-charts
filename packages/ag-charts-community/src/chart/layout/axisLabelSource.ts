import type { BoxBounds, LabelObstacle } from 'ag-charts-core';

import type { BBox } from '../../scene/bbox';
import type { LabelSource } from './labelManager';

/** Contributes an axis's drawn tick labels as obstacles that labels opting into `collideWith.axisLabels` avoid. */
export class AxisLabelSource implements LabelSource {
    readonly usesPlacedLabels = false;
    readonly axisLabelObstacles = true;
    nodeDataVersion = 0;

    constructor(
        readonly id: string,
        private readonly getCanvasBoxes: () => readonly BoxBounds[]
    ) {}

    getLabelObstacles(seriesRect: BBox): LabelObstacle[] {
        const obstacles: LabelObstacle[] = [];
        for (const { x, y, width, height } of this.getCanvasBoxes()) {
            const box = { x: x - seriesRect.x, y: y - seriesRect.y, width, height };
            obstacles.push({ kind: 'rect', box, category: 'axisLabel', sourceId: this.id });
        }
        return obstacles;
    }
}
