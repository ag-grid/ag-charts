import { type Direction, type _Scene, _Util } from 'ag-charts-community';

import type { AnnotationAxisContext, AnnotationContext, Coords } from '../annotationTypes';
import { convert, invertCoords, validateDatumPoint } from '../annotationUtils';
import { Annotation } from '../scenes/annotation';
import { AxisLabel } from '../scenes/axisLabel';
import { UnivariantHandle } from '../scenes/handle';
import { CollidableLine } from '../scenes/shapes';
import type { CrossLineAnnotation } from './crossLineProperties';

const { Vec2 } = _Util;

export class CrossLine extends Annotation {
    static override is(value: unknown): value is CrossLine {
        return Annotation.isCheck(value, 'cross-line');
    }

    type = 'cross-line';

    override activeHandle?: 'middle';

    private readonly line = new CollidableLine();
    private readonly middle = new UnivariantHandle();
    private readonly axisLabel = new AxisLabel();

    private seriesRect?: _Scene.BBox;
    private dragState?: {
        offset: Coords;
        middle: Coords;
    };

    constructor() {
        super();
        this.append([this.line, this.middle, this.axisLabel]);
    }

    public update(datum: CrossLineAnnotation, context: AnnotationContext) {
        const { line, middle } = this;
        const { direction, locked, visible, lineDash, lineDashOffset, stroke, strokeWidth, strokeOpacity, value } =
            datum;
        const { seriesRect } = context;

        this.locked = locked ?? false;
        this.seriesRect = seriesRect;

        const isHorizontalAxis = datum.direction === 'vertical';
        const axisContext = isHorizontalAxis ? context.xAxis : context.yAxis;

        const coords = this.convertCrossLine(datum, axisContext);

        if (coords == null) {
            this.visible = false;
            return;
        } else {
            this.visible = visible ?? true;
        }

        const { x1, y1, x2, y2 } = coords;

        line.setProperties({
            x1,
            y1,
            x2,
            y2,
            lineDash,
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
        });
        line.updateCollisionBBox();

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? strokeOpacity,
        };

        const x = x1 + (x2 - x1) / 2;
        const y = y1 + (y2 - y1) / 2;
        const { width: handleWidth, height: handleHeight } = middle.handle;
        middle.gradient = direction;
        middle.update({ ...handleStyles, x: x - handleWidth / 2, y: y - handleHeight / 2 });

        const { axisLabel } = this;
        if (datum.axisLabel.enabled) {
            axisLabel.visible = this.visible;
            const [labelX, labelY] =
                axisContext.position === 'left' || axisContext.position === 'top' ? [x1, y1] : [x2, y2];
            axisLabel.update({
                x: labelX,
                y: labelY,
                value,
                styles: datum.axisLabel,
                context: axisContext,
            });
        } else {
            axisLabel.visible = false;
        }
    }

    public toggleHandles(show: boolean) {
        this.middle.visible = show;
        this.middle.toggleHovered(show);
    }

    public toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.middle.toggleActive(active);
    }

    public dragStart(datum: CrossLineAnnotation, target: Coords, context: AnnotationContext) {
        const middle =
            datum.direction === 'horizontal'
                ? { x: target.x, y: convert(datum.value, context.yAxis) }
                : { x: convert(datum.value, context.xAxis), y: target.y };

        this.dragState = {
            offset: target,
            middle,
        };
    }

    public drag(datum: CrossLineAnnotation, target: Coords, context: AnnotationContext, onInvalid: () => void) {
        const { activeHandle, dragState, locked } = this;

        if (locked) return;

        let coords;

        if (activeHandle) {
            this[activeHandle].toggleDragging(true);
            coords = this[activeHandle].drag(target).point;
        } else if (dragState) {
            coords = Vec2.add(dragState.middle, Vec2.sub(target, dragState.offset));
        } else {
            return;
        }

        const point = invertCoords(coords, context);

        if (!validateDatumPoint(context, point)) {
            onInvalid();
            return;
        }

        const horizontal = datum.direction === 'horizontal';
        datum.set({ value: horizontal ? point.y : point.x });
    }

    override stopDragging() {
        this.middle.toggleDragging(false);
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return this[this.activeHandle].getCursor();
    }

    override containsPoint(x: number, y: number) {
        const { middle, seriesRect, line } = this;

        this.activeHandle = undefined;

        if (middle.containsPoint(x, y)) {
            this.activeHandle = 'middle';
            return true;
        }

        x -= seriesRect?.x ?? 0;
        y -= seriesRect?.y ?? 0;

        return line.isPointInPath(x, y);
    }

    override getAnchor() {
        const bbox = this.getCachedBBox();
        return { x: bbox.x + bbox.width / 2, y: bbox.y };
    }

    private convertCrossLine(
        datum: { value?: string | number | Date; direction: Direction },
        context: AnnotationAxisContext
    ) {
        if (datum.value == null) return;

        let x1 = 0;
        let x2 = 0;
        let y1 = 0;
        let y2 = 0;

        const { bounds, scaleConvert, scaleBandwidth } = context;
        const halfBandwidth = (scaleBandwidth() ?? 0) / 2;

        if (datum.direction === 'vertical') {
            const scaledValue = scaleConvert(datum.value) + halfBandwidth;
            x1 = scaledValue;
            x2 = scaledValue;
            y2 = bounds.height;
        } else {
            const scaledValue = scaleConvert(datum.value) + halfBandwidth;
            x2 = bounds.width;
            y1 = scaledValue;
            y2 = scaledValue;
        }

        return { x1, y1, x2, y2 };
    }
}
