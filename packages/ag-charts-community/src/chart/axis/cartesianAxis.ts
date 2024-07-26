import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { Scale } from '../../scale/scale';
import { POSITION, POSITIVE_NUMBER, Validate } from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { Axis } from './axis';
import { CartesianAxisLabel } from './cartesianAxisLabel';

export abstract class CartesianAxis<S extends Scale<D, number, any> = Scale<any, number, any>, D = any> extends Axis<
    S,
    D
> {
    static is(value: any): value is CartesianAxis<any> {
        return value instanceof CartesianAxis;
    }

    @Validate(POSITIVE_NUMBER)
    thickness: number = 0;

    @Validate(POSITION)
    position!: AgCartesianAxisPosition;

    get direction() {
        return ['top', 'bottom'].includes(this.position) ? ChartAxisDirection.X : ChartAxisDirection.Y;
    }

    protected updateDirection() {
        switch (this.position) {
            case 'top':
                this.rotation = -90;
                this.label.mirrored = true;
                this.label.parallel = true;
                break;
            case 'right':
                this.rotation = 0;
                this.label.mirrored = true;
                this.label.parallel = false;
                break;
            case 'bottom':
                this.rotation = -90;
                this.label.mirrored = false;
                this.label.parallel = true;
                break;
            case 'left':
                this.rotation = 0;
                this.label.mirrored = false;
                this.label.parallel = false;
                break;
        }

        if (this.axisContext) {
            this.axisContext.position = this.position;
            this.axisContext.direction = this.direction;
        }
    }

    override update(primaryTickCount?: number, animated?: boolean) {
        this.updateDirection();
        return super.update(primaryTickCount, animated);
    }

    override calculateLayout(primaryTickCount?: number) {
        this.updateDirection();
        const result = super.calculateLayout(primaryTickCount);
        // Because of the rotation technique used by axes rendering labels are padded 5px off,
        // which need to be account for in these calculations to make sure labels aren't being clipped.
        // This will become obsolete only once axes rotation technique would be removed.
        result.bbox.grow(5, this.position);
        return result;
    }

    override createAxisContext(): AxisContext {
        return {
            ...super.createAxisContext(),
            position: this.position,
        };
    }

    protected override createLabel() {
        return new CartesianAxisLabel();
    }
}
