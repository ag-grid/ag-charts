import { type BBox, ChartAxisDirection, Rect } from 'ag-charts-core';
import type { Point } from 'ag-charts-core';

import type { SelectionAxisStyles } from '../annotationDatum';
import type { AnnotationAxisContext } from '../annotationTypes';
import { getGroupingValue } from '../utils/scale';
import { isShown } from '../utils/selectionAxes';
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
    /** Changes when the chart lays out again, which can change how the axes format and place values. */
    layoutVersion: number;
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

// How far the labels at the axis ends reach depends on the axis and the label styles, so annotations share it.
const edgeReaches = new WeakMap<
    AnnotationAxisContext['attachLabel'],
    WeakMap<object, { layoutVersion: number; reach: number }>
>();

/**
 * The labels and shading for one axis of an annotation. They are attached to the axis, as a horizontal or
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

    update({ points, styles, selected, seriesRect, context, layoutVersion }: UpdateOpts) {
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

        const shown = isShown(styles.visible, selected);
        this.updateLabels(inRange, styles.axisLabel, shown, selected, seriesRect, context, edge);

        // Wider labels deepen the shading, which only grows while selected, so that it does not flicker as a handle drags.
        const showShading = shown && positions.length >= 2;
        const reach = showShading
            ? this.measureLabelReach(inRange.length, styles.axisLabel, layoutVersion, seriesRect, context, edge)
            : 0;
        this.labelReach = selected ? Math.max(this.labelReach, reach) : reach;
        this.updateShading(
            positions,
            length,
            styles.axisShading,
            showShading,
            this.labelReach,
            seriesRect,
            context,
            edge
        );
    }

    /** How far the axis labels reach from the axis: the deepest of those drawn and of those at either end of the axis. */
    private measureLabelReach(
        drawn: number,
        axisLabel: SelectionAxisStyles['axisLabel'],
        layoutVersion: number,
        seriesRect: BBox,
        context: AnnotationAxisContext,
        edge: AxisEdge
    ) {
        let reach = this.measureEdgeReach(axisLabel, layoutVersion, seriesRect, context, edge);
        for (const label of this.labels.slice(0, drawn)) {
            reach = Math.max(reach, label.getReach(edge.isX, edge.outward, edge.origin));
        }
        return reach;
    }

    private measureEdgeReach(
        axisLabel: SelectionAxisStyles['axisLabel'],
        layoutVersion: number,
        seriesRect: BBox,
        context: AnnotationAxisContext,
        { isX, origin, outward }: AxisEdge
    ) {
        const byStyles = edgeReaches.get(context.attachLabel) ?? new WeakMap();
        edgeReaches.set(context.attachLabel, byStyles);
        const cached = byStyles.get(axisLabel);
        if (cached?.layoutVersion === layoutVersion) return cached.reach;

        const probe = (this.probe ??= new AxisLabelScene());
        const length = isX ? seriesRect.width : seriesRect.height;
        let reach = 0;
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
        byStyles.set(axisLabel, { layoutVersion, reach });
        return reach;
    }

    private updateLabels(
        positions: number[],
        axisLabel: SelectionAxisStyles['axisLabel'],
        enabled: boolean,
        hold: boolean,
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
            if (!label.visible || !hold) label.resetWidth();
            if (!label.visible) continue;

            label.update({
                x: isX ? seriesRect.x + p : origin,
                y: isX ? origin : seriesRect.y + p,
                value: getGroupingValue(invert(p, context)),
                styles: axisLabel,
                context,
                holdWidth: hold,
            });
        }
    }

    private updateShading(
        positions: number[],
        length: number,
        axisShading: SelectionAxisStyles['axisShading'],
        show: boolean,
        labelReach: number,
        seriesRect: BBox,
        context: AnnotationAxisContext,
        { isX, origin, outward }: AxisEdge
    ) {
        const { shading } = this;

        const start = Math.max(0, Math.min(...positions));
        const end = Math.min(length, Math.max(...positions));
        shading.visible = show && end > start;
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

/** The axis labels of an annotation's points and the shading between them, on both axes. */
export class SelectionAxesScene {
    private readonly x = new AxisSelectionOverlay();
    private readonly y = new AxisSelectionOverlay();
    private last?: { coords: number[]; styles: SelectionAxisStyles; selected: boolean; layoutVersion: number };

    update(opts: Omit<UpdateOpts, 'context'> & { xAxis: AnnotationAxisContext; yAxis: AnnotationAxisContext }) {
        const { xAxis, yAxis, ...rest } = opts;
        if (this.isUnchanged(rest.points, rest.styles, rest.selected, rest.layoutVersion)) return;

        this.x.update({ ...rest, context: xAxis });
        this.y.update({ ...rest, context: yAxis });
    }

    hide() {
        this.last = undefined;
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

    // Runs for every shown annotation on every pre-render, so an overlay that would redraw as it is stays as it is.
    private isUnchanged(points: Point[], styles: SelectionAxisStyles, selected: boolean, layoutVersion: number) {
        const last = this.last;
        if (
            last?.styles === styles &&
            last.selected === selected &&
            last.layoutVersion === layoutVersion &&
            last.coords.length === points.length * 2 &&
            points.every((p, i) => last.coords[i * 2] === p.x && last.coords[i * 2 + 1] === p.y)
        ) {
            return true;
        }

        const coords: number[] = [];
        for (const { x, y } of points) coords.push(x, y);
        this.last = { coords, styles, selected, layoutVersion };
        return false;
    }
}
