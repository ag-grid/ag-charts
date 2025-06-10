import type { TextWrap } from 'ag-charts-types';

import { Property } from '../../util/properties';
import { AxisLabel } from './axisLabel';

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

    @Property
    wrapping: TextWrap = 'on-space';
}
