import type { NormalisedBasePolarAxisOptions, Scale } from 'ag-charts-core';
import { ChartAxisDirection } from 'ag-charts-core';

import type { BBox } from '../../scene/bbox';
import type { ChartAxisLabelFlipFlag } from '../chartAxis';
import type { PolarCrossLine } from '../crossline/crossLine';
import { Axis } from './axis';
import { getAxisLabelSideFlag } from './axisLabelUtil';
import type { TickInterval } from './axisTick';
import { resetAxisLabelSelectionFn } from './axisUtil';

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
    TOptions extends NormalisedBasePolarAxisOptions = NormalisedBasePolarAxisOptions,
> extends Axis<S, D, any, TOptions> {
    gridAngles: number[] | undefined;
    gridRange: number[] | undefined;

    get shape(): 'polygon' | 'circle' {
        return this.options.shape ?? 'polygon';
    }

    /**
     * `innerRadiusRatio` is user-facing on radius axes only. The polar chart
     * copies the radius axis's value onto the angle axis at layout time
     * (`polarChart.updateAxes`), so we keep an instance-level setter; reads
     * fall back to `options.innerRadiusRatio` if no override has been written.
     */
    private _innerRadiusRatio?: number;

    get innerRadiusRatio(): number {
        return this._innerRadiusRatio ?? this.options.innerRadiusRatio ?? 0;
    }

    set innerRadiusRatio(value: number) {
        this._innerRadiusRatio = value;
    }

    override defaultTickMinSpacing = 20;

    abstract calculateRotations(): { rotation: number; parallelFlipRotation: number; regularFlipRotation: number };

    override update() {
        super.update();

        this.tickLineGroup.visible = this.options.tick.enabled;
        this.tickLabelGroup.visible = this.options.label.enabled;
    }

    layoutCrossLines() {
        const sideFlag = getAxisLabelSideFlag(this.mirrored);
        const crosslinesVisible = this.hasDefinedDomain() || this.hasVisibleSeries();
        const { rotation, parallelFlipRotation, regularFlipRotation } = this.calculateRotations();

        for (const crossLine of this.crossLines as PolarCrossLine[]) {
            crossLine.sideFlag = -sideFlag as ChartAxisLabelFlipFlag;
            crossLine.direction = rotation === -Math.PI / 2 ? ChartAxisDirection.Angle : ChartAxisDirection.Radius;
            crossLine.parallelFlipRotation = parallelFlipRotation;
            crossLine.regularFlipRotation = regularFlipRotation;
            crossLine.calculateLayout?.(crosslinesVisible, this.reverse);
        }
    }

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

        this.tickLabelGroupSelection.each(resetAxisLabelSelectionFn());
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
