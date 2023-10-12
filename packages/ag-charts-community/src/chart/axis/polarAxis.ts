import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { NUMBER, Validate } from '../../util/validation';
import { Axis } from './axis';

export abstract class PolarAxis<S extends Scale<any, any, any> = Scale<any, any, any>> extends Axis<S> {
    gridAngles: number[] | undefined;

    shape: 'polygon' | 'circle' = 'polygon';

    @Validate(NUMBER(0, 1))
    innerRadiusRatio: number = 0;

    protected override defaultTickMinSpacing = 20;

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null {
        return null;
    }

    computeRange?: () => void;
}
