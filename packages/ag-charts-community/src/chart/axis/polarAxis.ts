import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { RATIO, Validate } from '../../util/validation';
import { Axis } from './axis';

export abstract class PolarAxis<S extends Scale<any, any, any> = Scale<any, any, any>> extends Axis<S> {
    gridAngles: number[] | undefined;
    gridRange: number[] | undefined;

    shape: 'polygon' | 'circle' = 'polygon';

    @Validate(RATIO)
    innerRadiusRatio: number = 0;

    protected override defaultTickMinSpacing = 20;

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null {
        return null;
    }

    computeRange?: () => void;
}
