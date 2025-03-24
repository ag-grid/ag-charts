import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import type { Line } from '../../scene/shape/line';
import { RATIO, TempValidate, UNION } from '../../util/validation';
import { Axis } from './axis';
import type { TickInterval } from './axisTick';
import { type AxisAnimationContext, prepareAxisAnimationContext, resetAxisLabelSelectionFn } from './axisUtil';

interface AxisNodeDatum {
    translationY: number;
    tickId: string;
}

function resetAxisSelectionFn(ctx: AxisAnimationContext) {
    const { visible: rangeVisible, min, max } = ctx;

    return (_node: Line, datum: AxisNodeDatum) => {
        const y = datum.translationY;

        const visible = rangeVisible && y >= min && y <= max;
        return {
            y,
            translationY: 0,
            opacity: 1,
            visible,
        };
    };
}

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

    @TempValidate(UNION(['polygon', 'circle'], 'a polar axis shape'))
    shape: 'polygon' | 'circle' = 'polygon';

    @TempValidate(RATIO)
    innerRadiusRatio: number = 0;

    override defaultTickMinSpacing = 20;

    override updatePosition(): void {
        super.updatePosition();

        const selectionCtx = prepareAxisAnimationContext(this);
        const resetAxisFn = resetAxisSelectionFn(selectionCtx);

        const axisTransform = this.getAxisTransform();
        this.tickLineGroup.datum = axisTransform;
        this.tickLabelGroup.datum = axisTransform;
        this.labelGroup.datum = axisTransform;

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
