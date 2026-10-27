import type { BBox, NormalisedBasePolarAxisOptions, PolarAxisLayout, Scale } from 'ag-charts-core';
import { Transformable } from 'ag-charts-core';
import type { AgAxisListeners } from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import { AxisLabelSource } from '../layout/axisLabelSource';
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
    TOptions extends NormalisedBasePolarAxisOptions = NormalisedBasePolarAxisOptions,
> extends Axis<S, D, any, TOptions> {
    gridAngles: number[] | undefined;
    gridRange: number[] | undefined;

    readonly labelSource = new AxisLabelSource(`axisLabels:${this.id}`, (seriesRect) =>
        this.getTickLabelBoxes(seriesRect)
    );

    get shape(): 'polygon' | 'circle' {
        return this.options.shape;
    }

    protected override get userListeners(): AgAxisListeners<unknown> | undefined {
        return this.options.listeners;
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

    override destroy() {
        this.moduleCtx.labelManager.unregisterSource(this.labelSource.id, this.labelSource);
        super.destroy();
    }

    override update() {
        super.update();
        this.labelSource.nodeDataVersion++;

        this.tickLineGroup.visible = this.options.tick.enabled;
        this.tickLabelGroup.visible = this.options.label.enabled;
    }

    override createAxisContext(): AxisContext {
        const ctx = super.createAxisContext();
        ctx.getPolarLayout = () => this.computePolarLayout();
        return ctx;
    }

    /**
     * Builds the polar-layout snapshot exposed via {@link AxisContext.getPolarLayout}. Each
     * concrete polar-axis subclass projects its own outer/inner radius (the angle axis derives
     * radii from `gridLength`; the radius axis from `range`) and supplies the per-axis-type
     * extras (`ticks` for angle axes, `gridAngles` for radius axes).
     */
    protected abstract computePolarLayout(): PolarAxisLayout;

    override updatePosition(): void {
        super.updatePosition();

        const translationX = Math.floor(this.translation.x);
        const translationY = Math.floor(this.translation.y);

        this.tickLineGroup.translationX = translationX;
        this.tickLineGroup.translationY = translationY;

        this.tickLabelGroup.translationX = translationX;
        this.tickLabelGroup.translationY = translationY;

        this.tickLabelGroupSelection.each(resetAxisLabelSelectionFn());
    }

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null {
        return null;
    }

    private getTickLabelBoxes(seriesRect: BBox): BBox[] {
        if (!this.tickLabelGroup.visible) return [];
        const boxes: BBox[] = [];
        for (const node of this.tickLabelGroupSelection.nodes()) {
            if (!node.visible) continue;
            boxes.push(Transformable.toCanvas(node).translate(-seriesRect.x, -seriesRect.y));
        }
        return boxes;
    }

    computeRange(): void {
        // May be implemented by children
    }

    getAxisLinePoints(): { points: PolarAxisPathPoint[]; closePath: boolean } | undefined {
        return undefined;
    }
}
