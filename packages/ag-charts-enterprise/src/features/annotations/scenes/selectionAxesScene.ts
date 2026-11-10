import { type BBox, ChartAxisDirection, Rect } from 'ag-charts-core';
import type { Point } from 'ag-charts-core';

import type { AxisLabelDatum, SelectionAxesFields } from '../annotationDatum';
import type { AnnotationAxisContext } from '../annotationTypes';
import { getGroupingValue } from '../utils/scale';
import { invert } from '../utils/values';
import { AxisLabelScene } from './axisLabelScene';

type AxisPosition = NonNullable<AnnotationAxisContext['position']>;

interface UpdateOpts {
    /** Where the annotation's handles are, relative to the series area. */
    points: Point[];
    styles: SelectionAxesFields;
    seriesRect: BBox;
    context: AnnotationAxisContext;
}

/**
 * The labels and shading for one axis of a selected annotation. They are attached to the axis, as a horizontal or
 * vertical line's axis label is, so they draw over its ticks and tick labels.
 */
class SelectionAxisScene {
    private readonly shading = new Rect({ name: 'AnnotationSelectionAxisShading' });
    private readonly labels: AxisLabelScene[] = [];
    // The axis's `attachLabel` identifies it: an axis that is recreated has a new one, and its layer is a new group.
    private attachedTo?: AnnotationAxisContext['attachLabel'];
    private opacity = 1;

    constructor() {
        this.shading.zIndex = 0;
        this.shading.visible = false;
    }

    update({ points, styles, seriesRect, context }: UpdateOpts) {
        this.attach(context);

        const isX = context.direction === ChartAxisDirection.X;
        const position: AxisPosition = context.position ?? (isX ? 'bottom' : 'left');
        const length = isX ? seriesRect.width : seriesRect.height;

        // Handles that share a position, such as a channel's top and bottom ends, would draw the same label twice.
        // The first of them is kept, unrounded, so that its label reads the exact value.
        const byPixel = new Map<number, number>();
        for (const point of points) {
            const p = isX ? point.x : point.y;
            const pixel = Math.round(p);
            if (!byPixel.has(pixel)) byPixel.set(pixel, p);
        }
        const positions = [...byPixel.values()];
        const inRange = positions.filter((p) => context.inRange(p));

        this.updateLabels(inRange, styles.axisLabel, seriesRect, context, position);
        this.updateShading(positions, length, styles, seriesRect, context, position, isX);
    }

    private updateLabels(
        positions: number[],
        axisLabel: AxisLabelDatum,
        seriesRect: BBox,
        context: AnnotationAxisContext,
        position: AxisPosition
    ) {
        const { labels } = this;
        const enabled = axisLabel.enabled ?? true;
        const isX = context.direction === ChartAxisDirection.X;

        while (labels.length < positions.length) {
            const label = new AxisLabelScene();
            label.zIndex = 1;
            label.opacity = this.opacity;
            context.attachLabel(label);
            labels.push(label);
        }

        for (const [index, label] of labels.entries()) {
            const p = positions[index];
            label.visible = enabled && p != null;
            if (!label.visible) continue;

            const corner = isX
                ? { x: p, y: position === 'top' ? 0 : seriesRect.height }
                : { x: position === 'left' ? 0 : seriesRect.width, y: p };

            label.update({
                x: corner.x + seriesRect.x,
                y: corner.y + seriesRect.y,
                value: getGroupingValue(invert(p, context)),
                styles: axisLabel,
                context,
            });
        }
    }

    private updateShading(
        positions: number[],
        length: number,
        { axisLabel, axisShading }: SelectionAxesFields,
        seriesRect: BBox,
        context: AnnotationAxisContext,
        position: AxisPosition,
        isX: boolean
    ) {
        const { shading } = this;

        const start = Math.max(0, Math.min(...positions));
        const end = Math.min(length, Math.max(...positions));
        shading.visible = (axisShading.enabled ?? true) && positions.length >= 2 && end > start;
        if (!shading.visible) return;

        // The shading reaches the further of the tick labels and the annotation's own labels, which sit beyond them.
        const labelBoxes = this.labels.filter((label) => label.visible).map((label) => label.getBBox());
        const { thickness } = context;
        const along = end - start;
        if (isX) {
            const near = seriesRect.y - thickness;
            const far = seriesRect.y + seriesRect.height + thickness;
            const top =
                position === 'top'
                    ? Math.min(near, ...labelBoxes.map((box) => box.y))
                    : seriesRect.y + seriesRect.height;
            const bottom =
                position === 'top' ? seriesRect.y : Math.max(far, ...labelBoxes.map((box) => box.y + box.height));
            shading.x = seriesRect.x + start;
            shading.y = top;
            shading.width = along;
            shading.height = bottom - top;
        } else {
            const near = seriesRect.x - thickness;
            const far = seriesRect.x + seriesRect.width + thickness;
            const left =
                position === 'left'
                    ? Math.min(near, ...labelBoxes.map((box) => box.x))
                    : seriesRect.x + seriesRect.width;
            const right =
                position === 'left' ? seriesRect.x : Math.max(far, ...labelBoxes.map((box) => box.x + box.width));
            shading.x = left;
            shading.y = seriesRect.y + start;
            shading.width = right - left;
            shading.height = along;
        }

        shading.fill = axisShading.fill ?? axisLabel.fill;
        shading.fillOpacity = axisShading.fillOpacity ?? 1;
        shading.strokeWidth = 0;
    }

    hide() {
        this.shading.visible = false;
        for (const label of this.labels) {
            label.visible = false;
        }
    }

    setOpacity(opacity: number) {
        this.opacity = opacity;
        this.shading.opacity = opacity;
        for (const label of this.labels) {
            label.opacity = opacity;
        }
    }

    destroy() {
        this.shading.destroy();
        for (const label of this.labels) {
            label.destroy();
        }
    }

    private attach({ attachLabel }: AnnotationAxisContext) {
        if (this.attachedTo === attachLabel) return;

        // Moves everything to the new axis, which has to happen when the chart recreates its axes while the annotation
        // is selected. Labels created later attach to the axis they are created for.
        for (const node of [this.shading, ...this.labels]) {
            node.remove();
            attachLabel(node);
        }
        this.attachedTo = attachLabel;
    }
}

/** The axis labels and shading shown on both axes while an annotation with two or more points is selected. */
export class SelectionAxesScene {
    private readonly x = new SelectionAxisScene();
    private readonly y = new SelectionAxisScene();

    update(opts: Omit<UpdateOpts, 'context'> & { xAxis: AnnotationAxisContext; yAxis: AnnotationAxisContext }) {
        const { xAxis, yAxis, ...rest } = opts;
        this.x.update({ ...rest, context: xAxis });
        this.y.update({ ...rest, context: yAxis });
    }

    hide() {
        this.x.hide();
        this.y.hide();
    }

    setOpacity(opacity: number) {
        this.x.setOpacity(opacity);
        this.y.setOpacity(opacity);
    }

    destroy() {
        this.x.destroy();
        this.y.destroy();
    }
}
