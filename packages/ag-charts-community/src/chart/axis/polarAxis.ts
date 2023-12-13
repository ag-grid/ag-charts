import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { RATIO, UNION, Validate } from '../../util/validation';
import { Axis } from './axis';

export const POLAR_AXIS_SHAPE = UNION(['polygon', 'circle'], 'a polar axis shape');

export abstract class PolarAxis<S extends Scale<any, any, any> = Scale<any, any, any>> extends Axis<S> {
    gridAngles: number[] | undefined;
    gridRange: number[] | undefined;

    @Validate(POLAR_AXIS_SHAPE)
    shape: 'polygon' | 'circle' = 'polygon';

    @Validate(RATIO)
    innerRadiusRatio: number = 0;

    protected override defaultTickMinSpacing = 20;

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null {
        return null;
    }

    computeRange?: () => void;
}
