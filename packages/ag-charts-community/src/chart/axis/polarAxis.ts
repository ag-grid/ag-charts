import { Axis } from '../../axis';
import type { BBox } from '../../scene/bbox';
import type { Scale } from '../../scale/scale';

export abstract class PolarAxis<S extends Scale<any, any, any> = Scale<any, any, any>> extends Axis<S> {
    gridAngles: number[] | undefined;

    shape: 'polygon' | 'circle' = 'polygon';

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null {
        return null;
    }
}
