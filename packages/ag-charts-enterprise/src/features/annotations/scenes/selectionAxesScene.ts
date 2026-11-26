import { type BBox, ChartAxisDirection, Rect } from 'ag-charts-core';
import type { Point } from 'ag-charts-core';

import type { SelectionAxesStyles, SelectionAxisStyles } from '../annotationDatum';
import type { AnnotationAxisContext } from '../annotationTypes';
import { getGroupingValue } from '../utils/scale';
import { invert } from '../utils/values';
import { AxisLabelScene } from './axisLabelScene';

type AxisPosition = NonNullable<AnnotationAxisContext['position']>;

interface UpdateOpts {
    /** Where the annotation's handles are, relative to the series area. */
    points: Point[];
    styles: SelectionAxisStyles;
    selected: boolean;
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

/** Whether the labels or shading of an axis show whether or not the annotation is selected. */
export function isAlways({ axisLabel, axisShading }: SelectionAxisStyles) {
    return axisLabel.visible === 'always' || axisShading.visible === 'always';
}

function isShown(visible: SelectionAxisStyles['axisLabel']['visible'], selected: boolean) {
    return visible === 'always' || (visible === 'selected' && selected);
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
    // Measures the labels at the ends of the axis, which are not drawn.
    private probe?: AxisLabelScene;
    // The deepest the labels have reached while the shading has been shown, which it does not shrink back from.
    private labelReach = 0;

    constructor() {
        // Beneath a cross-line's axis label, which has the default z-index, while the selection's own labels sit above it.
        this.shading.zIndex = -1;
        this.shading.visible = false;
    }

    update({ points, styles, selected, seriesRect, context }: UpdateOpts) {
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

        const showLabels = isShown(styles.axisLabel.visible, selected);
        this.updateLabels(inRange, styles.axisLabel, showLabels, seriesRect, context, edge);

        // The shading is as deep as the labels it sits behind. They are wider for values of more digits, so it only
        // grows, until the shading is hidden, rather than follow them as a handle is dragged.
        const showShading = isShown(styles.axisShading.visible, selected) && positions.length >= 2;
        this.labelReach =
            showLabels && showShading
                ? Math.max(
                      this.labelReach,
                      this.measureLabelReach(inRange.length, styles.axisLabel, seriesRect, context, edge)
                  )
                : 0;
        this.updateShading(positions, length, styles.axisShading, selected, this.labelReach, seriesRect, context, edge);
    }

    /** How far the axis labels reach from the axis: the deepest of those drawn and of those at either end of the axis. */
    private measureLabelReach(
        drawn: number,
        axisLabel: SelectionAxisStyles['axisLabel'],
        seriesRect: BBox,
        context: AnnotationAxisContext,
        { isX, origin, outward }: AxisEdge
    ) {
        const probe = (this.probe ??= new AxisLabelScene());
        const length = isX ? seriesRect.width : seriesRect.height;
        let reach = 0;
        for (const label of this.labels.slice(0, drawn)) {
            reach = Math.max(reach, label.getReach(isX, outward, origin));
        }
        for (const p of [0, length]) {
            probe.update({
                x: isX ? seriesRect.x + p : origin,
                y: isX ? origin : seriesRect.y + p,
                value: getGroupingValue(invert(p, context)),
                styles: axisLabel,
                context,
            });
            reach = Math.max(reach, probe.getReach(isX, outward, origin));
        }
        return reach;
    }

    private updateLabels(
        positions: number[],
        axisLabel: SelectionAxisStyles['axisLabel'],
        enabled: boolean,
        seriesRect: BBox,
        context: AnnotationAxisContext,
        { isX, origin }: AxisEdge
    ) {
        const { labels } = this;

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
            if (!label.visible) {
                label.resetWidth();
                continue;
            }

            label.update({
                x: isX ? seriesRect.x + p : origin,
                y: isX ? origin : seriesRect.y + p,
                value: getGroupingValue(invert(p, context)),
                styles: axisLabel,
                context,
                holdWidth: true,
            });
        }
    }

    private updateShading(
        positions: number[],
        length: number,
        axisShading: SelectionAxisStyles['axisShading'],
        selected: boolean,
        labelReach: number,
        seriesRect: BBox,
        context: AnnotationAxisContext,
        { isX, origin, outward }: AxisEdge
    ) {
        const { shading } = this;

        const start = Math.max(0, Math.min(...positions));
        const end = Math.min(length, Math.max(...positions));
        shading.visible = isShown(axisShading.visible, selected) && positions.length >= 2 && end > start;
        if (!shading.visible) return;

        // The axis's ticks and tick labels, or the labels if they are deeper.
        const reach = Math.max(context.thickness, labelReach);
        const from = outward > 0 ? origin : origin - reach;
        const along = end - start;
        if (isX) {
            shading.setProperties({ x: seriesRect.x + start, y: from, width: along, height: reach });
        } else {
            shading.setProperties({ x: from, y: seriesRect.y + start, width: reach, height: along });
        }

        shading.fill = axisShading.fill;
        shading.fillOpacity = axisShading.fillOpacity ?? 1;
        shading.strokeWidth = 0;
    }

    hide() {
        this.labelReach = 0;
        this.shading.visible = false;
        for (const label of this.labels) {
            label.visible = false;
            label.resetWidth();
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
        this.probe?.destroy();
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

    update(
        opts: Omit<UpdateOpts, 'context' | 'styles'> & {
            styles: SelectionAxesStyles;
            xAxis: AnnotationAxisContext;
            yAxis: AnnotationAxisContext;
        }
    ) {
        const { xAxis, yAxis, styles, ...rest } = opts;
        this.x.update({ ...rest, styles: styles.x, context: xAxis });
        this.y.update({ ...rest, styles: styles.y, context: yAxis });
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
