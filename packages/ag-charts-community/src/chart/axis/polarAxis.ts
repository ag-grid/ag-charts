import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { RATIO, UNION, Validate } from '../../util/validation';
import { Axis, type TickInterval } from './axis';

export interface PolarAxisPathPoint {
    x: number;
    y: number;
    moveTo: boolean;
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    arc?: boolean;
}
export abstract class PolarAxis<
    S extends Scale<D, number, TickInterval<S>> = Scale<any, number, any>,
    D = any,
> extends Axis<S, D> {
    gridAngles: number[] | undefined;
    gridRange: number[] | undefined;

    @Validate(UNION(['polygon', 'circle'], 'a polar axis shape'))
    shape: 'polygon' | 'circle' = 'polygon';

    @Validate(RATIO)
    innerRadiusRatio: number = 0;

    protected override defaultTickMinSpacing = 20;

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null {
        return null;
    }

    computeRange?: () => void;

    getAxisLinePoints?(): { points: PolarAxisPathPoint[]; closePath: boolean };
}
