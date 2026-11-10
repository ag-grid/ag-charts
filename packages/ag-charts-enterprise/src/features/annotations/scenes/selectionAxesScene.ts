import { type BBox, ChartAxisDirection, Rect } from 'ag-charts-core';
import type { Point } from 'ag-charts-core';

import type { AxisLabelDatum, SelectionAxesFields, SelectionColours } from '../annotationDatum';
import type { AnnotationAxisContext } from '../annotationTypes';
import { getGroupingValue } from '../utils/scale';
import { invert } from '../utils/values';
import { AxisLabelScene } from './axisLabelScene';

type AxisPosition = NonNullable<AnnotationAxisContext['position']>;

interface UpdateOpts {
    /** Where the annotation's handles are, relative to the series area. */
    points: Point[];
    styles: SelectionAxesFields;
    /** What the labels and shading are filled with when the styles do not set it. */
    colours: SelectionColours;
    seriesRect: BBox;
    context: AnnotationAxisContext;
}

interface AxisEdge {
    isX: boolean;
    /** The coordinate of the series area's edge that the axis sits against, across the axis. */
    origin: number;
    /** `1` when the axis lies after that edge (bottom, right), `-1` when it lies before it (top, left). */
    outward: 1 | -1;
}

function getAxisEdge({ x, y, width, height }: BBox, isX: boolean, position: AxisPosition): AxisEdge {
    const outward = position === 'top' || position === 'left' ? -1 : 1;
    const [start, size] = isX ? [y, height] : [x, width];
    return { isX, origin: outward > 0 ? start + size : start, outward };
}

/**
 * The labels and shading for one axis of a selected annotation. They are attached to the axis, as a horizontal or
 * vertical line's axis label is, so they draw over its ticks and tick labels.
 */
class AxisSelectionOverlay {
    private readonly shading = new Rect({ name: 'AnnotationSelectionAxisShading' });
    private readonly labels: AxisLabelScene[] = [];
    // The axis's `attachLabel` identifies it: an axis that is recreated has a new one, and its layer is a new group.
    private attachedTo?: AnnotationAxisContext['attachLabel'];
    private opacity = 1;

    constructor() {
        // Beneath a cross-line's axis label, which has the default z-index, while the selection's own labels sit above it.
        this.shading.zIndex = -1;
        this.shading.visible = false;
    }

    update({ points, styles, colours, seriesRect, context }: UpdateOpts) {
        this.attach(context);

        const isX = context.direction === ChartAxisDirection.X;
        const edge = getAxisEdge(seriesRect, isX, context.position ?? (isX ? 'bottom' : 'left'));
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

        this.updateLabels(inRange, styles.axisLabel, colours, seriesRect, context, edge);
        this.updateShading(positions, length, styles, colours, seriesRect, context, edge);
    }

    private updateLabels(
        positions: number[],
        axisLabel: AxisLabelDatum,
        { stroke, strokeOpacity }: SelectionColours,
        seriesRect: BBox,
        context: AnnotationAxisContext,
        { isX, origin }: AxisEdge
    ) {
        const { labels } = this;
        const enabled = axisLabel.enabled ?? true;
        const styles = {
            ...axisLabel,
            fill: axisLabel.fill ?? stroke,
            fillOpacity: axisLabel.fillOpacity ?? strokeOpacity,
        };

        // Labels are pooled: a spare one is hidden rather than removed, and there are at most a handful per axis.
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

            label.update({
                x: isX ? seriesRect.x + p : origin,
                y: isX ? origin : seriesRect.y + p,
                value: getGroupingValue(invert(p, context)),
                styles,
                context,
            });
        }
    }

    private updateShading(
        positions: number[],
        length: number,
        { axisShading }: SelectionAxesFields,
        colours: SelectionColours,
        seriesRect: BBox,
        context: AnnotationAxisContext,
        { isX, origin, outward }: AxisEdge
    ) {
        const { shading } = this;

        const start = Math.max(0, Math.min(...positions));
        const end = Math.min(length, Math.max(...positions));
        shading.visible = (axisShading.enabled ?? true) && positions.length >= 2 && end > start;
        if (!shading.visible) return;

        // The shading reaches the further of the tick labels and the annotation's own labels, which sit beyond them.
        const outerEdge = (box: BBox) => {
            const [near, size] = isX ? [box.y, box.height] : [box.x, box.width];
            return outward > 0 ? near + size : near;
        };
        const labelReach = this.labels
            .filter((label) => label.visible)
            .map((label) => outward * (outerEdge(label.getBBox()) - origin));
        const reach = Math.max(context.thickness, ...labelReach);
        const from = outward > 0 ? origin : origin - reach;
        const along = end - start;
        if (isX) {
            shading.setProperties({ x: seriesRect.x + start, y: from, width: along, height: reach });
        } else {
            shading.setProperties({ x: from, y: seriesRect.y + start, width: reach, height: along });
        }

        shading.fill = axisShading.fill ?? colours.fill;
        shading.fillOpacity = axisShading.fillOpacity ?? colours.fillOpacity ?? 1;
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
    private readonly x = new AxisSelectionOverlay();
    private readonly y = new AxisSelectionOverlay();

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
