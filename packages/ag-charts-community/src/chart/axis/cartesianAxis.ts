import type { AxisContext } from '../../module/moduleContext';
import type { AgCartesianAxisPosition } from '../../options/agChartOptions';
import type { Scale } from '../../scale/scale';
import { NUMBER, POSITION, Validate } from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { assignJsonApplyConstructedArray } from '../chartOptions';
import { CartesianCrossLine } from '../crossline/cartesianCrossLine';
import type { CrossLine } from '../crossline/crossLine';
import { Axis } from './axis';
import type { TickInterval } from './axisTick';
import { CartesianAxisLabel } from './cartesianAxisLabel';

export abstract class CartesianAxis<
    S extends Scale<D, number, TickInterval<S>> = Scale<any, number, any>,
    D = any,
> extends Axis<S, D> {
    @Validate(NUMBER(0))
    thickness: number = 0;

    @Validate(POSITION)
    position: AgCartesianAxisPosition = 'left';

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

    update(primaryTickCount?: number): number | undefined {
        this.updateDirection();
        return super.update(primaryTickCount);
    }

    protected createAxisContext(): AxisContext {
        return {
            ...super.createAxisContext(),
            position: this.position,
        };
    }

    protected assignCrossLineArrayConstructor(crossLines: CrossLine[]) {
        assignJsonApplyConstructedArray(crossLines, CartesianCrossLine);
    }

    protected createLabel() {
        return new CartesianAxisLabel();
    }
}
