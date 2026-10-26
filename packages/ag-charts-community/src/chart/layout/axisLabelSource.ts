import type { BBox, BoxBounds, LabelObstacle } from 'ag-charts-core';

import type { LabelSource } from './labelManager';

/** Contributes an axis's drawn tick labels as obstacles that labels opting into `collideWith.axisLabels` avoid. */
export class AxisLabelSource implements LabelSource {
    readonly usesPlacedLabels = false;
    readonly axisLabelObstacles = true;
    nodeDataVersion = 0;

    constructor(
        readonly id: string,
        /** Boxes in the space placement works in, offset from the canvas by `seriesRect`. */
        private readonly getBoxes: (seriesRect: BBox) => readonly BoxBounds[]
    ) {}

    getLabelObstacles(seriesRect: BBox): LabelObstacle[] {
        return this.getBoxes(seriesRect).map((box): LabelObstacle => ({
            kind: 'rect',
            box,
            category: 'axisLabel',
            sourceId: this.id,
        }));
    }
}
