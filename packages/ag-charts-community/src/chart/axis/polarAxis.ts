import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { Property } from '../../util/properties';
import { Axis } from './axis';
import type { TickInterval } from './axisTick';
import { prepareAxisAnimationContext, resetAxisLabelSelectionFn, resetAxisSelectionFn } from './axisUtil';

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
    TickDatum = any,
    TickLabelDatum = TickDatum,
> extends Axis<S, D, TickDatum, TickLabelDatum> {
    gridAngles: number[] | undefined;
    gridRange: number[] | undefined;

    @Property
    shape: 'polygon' | 'circle' = 'polygon';

    @Property
    innerRadiusRatio: number = 0;

    override defaultTickMinSpacing = 20;

    override updatePosition(): void {
        super.updatePosition();

        const selectionCtx = prepareAxisAnimationContext(this);
        const resetAxisFn = resetAxisSelectionFn(selectionCtx);

        this.axisGroup.setProperties(this.getAxisTransform());

        this.gridLineGroupSelection.each(resetAxisFn as any);
        this.tickLineGroupSelection.each(resetAxisFn as any);
        this.tickLabelGroupSelection.each(resetAxisLabelSelectionFn() as any);
    }

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null {
        return null;
    }

    computeRange(): void {
        // May be implemented by children
    }

    getAxisLinePoints(): { points: PolarAxisPathPoint[]; closePath: boolean } | undefined {
        return undefined;
    }
}
