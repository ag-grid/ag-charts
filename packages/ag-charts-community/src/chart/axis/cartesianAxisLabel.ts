import { NUMBER, OPT_BOOLEAN, Validate } from '../../util/validation';
import { AxisLabel } from './axisLabel';

export class CartesianAxisLabel extends AxisLabel {
    /**
     * If specified and axis labels may collide, they are rotated to reduce collisions. If the
     * `rotation` property is specified, it takes precedence.
     */
    @Validate(OPT_BOOLEAN)
    autoRotate: boolean | undefined = undefined;

    /**
     * Rotation angle to use when autoRotate is applied.
     */
    @Validate(NUMBER(-360, 360))
    autoRotateAngle: number = 335;
}
