import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { Scale } from '../../scale/scale';
import { POSITION, POSITIVE_NUMBER, Validate } from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { assignJsonApplyConstructedArray } from '../chartOptions';
import { CartesianCrossLine } from '../crossline/cartesianCrossLine';
import type { CrossLine } from '../crossline/crossLine';
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
        return super.calculateLayout(primaryTickCount);
    }

    override createAxisContext(): AxisContext {
        return {
            ...super.createAxisContext(),
            position: this.position,
        };
    }

    protected assignCrossLineArrayConstructor(crossLines: CrossLine[]) {
        assignJsonApplyConstructedArray(crossLines, CartesianCrossLine);
    }

    protected override createLabel() {
        return new CartesianAxisLabel();
    }
}
