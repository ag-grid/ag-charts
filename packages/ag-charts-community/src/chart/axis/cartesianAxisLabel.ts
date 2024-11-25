import { BOOLEAN, NUMBER, Validate } from '../../util/validation';
import { AxisLabel } from './axisLabel';

export class CartesianAxisLabel extends AxisLabel {
    /**
     * If specified and axis labels may collide, they are rotated to reduce collisions. If the
     * `rotation` property is specified, it takes precedence.
     */
    @Validate(BOOLEAN, { optional: true })
    autoRotate?: boolean;

    /**
     * Rotation angle to use when autoRotate is applied.
     */
    @Validate(NUMBER)
    autoRotateAngle: number = 335;
}
