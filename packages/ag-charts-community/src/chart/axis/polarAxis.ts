import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import type { Line } from '../../scene/shape/line';
import { Property } from '../../util/properties';
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

    @Property
    shape: 'polygon' | 'circle' = 'polygon';

    @Property
    innerRadiusRatio: number = 0;

    override defaultTickMinSpacing = 20;

    override updatePosition(): void {
        super.updatePosition();

        const translationX = Math.floor(this.translation.x);
        const translationY = Math.floor(this.translation.y);

        this.tickLineGroup.translationX = translationX;
        this.tickLineGroup.translationY = translationY;

        this.tickLabelGroup.translationX = translationX;
        this.tickLabelGroup.translationY = translationY;

        this.crossLineRangeGroup.translationX = translationX;
        this.crossLineRangeGroup.translationY = translationY;

        this.crossLineLineGroup.translationX = translationX;
        this.crossLineLineGroup.translationY = translationY;

        this.crossLineLabelGroup.translationX = translationX;
        this.crossLineLabelGroup.translationY = translationY;

        this.gridGroup.translationX = translationX;
        this.gridGroup.translationY = translationY;

        const selectionCtx = prepareAxisAnimationContext(this);
        const resetAxisFn = resetAxisSelectionFn(selectionCtx);
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
