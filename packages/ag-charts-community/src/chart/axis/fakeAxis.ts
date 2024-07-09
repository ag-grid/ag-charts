import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { Scale } from '../../scale/scale';
import { POSITION, POSITIVE_NUMBER, Validate } from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { FakeBaseAxis } from './fakeBaseAxis';

export abstract class FakeAxis<S extends Scale<D, number, any> = Scale<any, number, any>, D = any> extends FakeBaseAxis<
    S,
    D
> {
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
}
