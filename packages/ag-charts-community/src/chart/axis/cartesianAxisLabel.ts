import { Property } from 'ag-charts-core';

import { SeriesLabelProperties } from '../series/seriesLabelProperties';

export class CartesianAxisLabel extends SeriesLabelProperties {
    /**
     * If specified and axis labels may collide, they are rotated to reduce collisions. If the
     * `rotation` property is specified, it takes precedence.
     */
    @Property
    autoRotate?: boolean;

    /**
     * Rotation angle to use when autoRotate is applied.
     */
    @Property
    autoRotateAngle: number = 335;
}
