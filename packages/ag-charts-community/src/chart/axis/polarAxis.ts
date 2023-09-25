import { Axis } from './axis';
import type { BBox } from '../../scene/bbox';
import type { Scale } from '../../scale/scale';
import { Validate, NUMBER } from '../../util/validation';

export abstract class PolarAxis<S extends Scale<any, any, any> = Scale<any, any, any>> extends Axis<S> {
    gridAngles: number[] | undefined;

    shape: 'polygon' | 'circle' = 'polygon';

    @Validate(NUMBER(0, 1))
    innerRadiusRatio: number = 0;

    protected defaultTickMinSpacing = 20;

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null {
        return null;
    }
}
