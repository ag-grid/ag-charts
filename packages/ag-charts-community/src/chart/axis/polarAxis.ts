import type { Scale } from 'ag-charts-core';

import type { BBox } from '../../scene/bbox';
import { Property } from '../../util/properties';
import type { ChartAxisLabelFlipFlag } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { PolarCrossLine } from '../crossline/crossLine';
import { Axis } from './axis';
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
> extends Axis<S, D> {
    gridAngles: number[] | undefined;
    gridRange: number[] | undefined;

    @Property
    shape: 'polygon' | 'circle' = 'polygon';

    @Property
    innerRadiusRatio: number = 0;

    override defaultTickMinSpacing = 20;

    abstract calculateRotations(): { rotation: number; parallelFlipRotation: number; regularFlipRotation: number };

    override update() {
        super.update();

        this.tickLineGroup.visible = this.tick.enabled;
        this.tickLabelGroup.visible = this.label.enabled;
    }

    layoutCrossLines() {
        const sideFlag = this.label.getSideFlag();
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
