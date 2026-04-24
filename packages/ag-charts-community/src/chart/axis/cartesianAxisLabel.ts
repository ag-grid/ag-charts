import { Property } from 'ag-charts-core';

import { AxisLabel } from './axisLabel';

// NOTE: AxisLabel still extends BaseProperties (shared with enterprise series labels). Subclass
// fields therefore require @Property so BaseProperties.set() iterates them during applyOptions.
export class CartesianAxisLabel extends AxisLabel {
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
