import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import type { AnnotationAxisContext, AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { convert, invertCoords, validateDatumPoint } from '../annotationUtils';
import { Annotation } from '../scenes/annotation';
import { AxisLabel } from '../scenes/axisLabel';
import { UnivariantHandle } from '../scenes/handle';
import { CollidableLine } from '../scenes/shapes';
import { type CrossLineAnnotation, HorizontalLineAnnotation } from './crossLineProperties';

const { Vec2 } = _Util;
const { ChartAxisDirection } = _ModuleSupport;

export class CrossLine extends Annotation {
    static override is(value: unknown): value is CrossLine {
        return Annotation.isCheck(value, 'cross-line');
    }

    type = 'cross-line';

    override activeHandle?: 'middle';

    private readonly line = new CollidableLine();
    private readonly middle = new UnivariantHandle();
    private axisLabel?: AxisLabel;

    private seriesRect?: _Scene.BBox;
    private dragState?: {
        offset: Coords;
        middle: Coords;
    };
    private isHorizontal = false;

    constructor() {
        super();
        this.append([this.line, this.middle]);
    }

    public update(datum: CrossLineAnnotation, context: AnnotationContext) {
        const { line, middle } = this;
        const { locked, visible, lineDash, lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
        const { seriesRect } = context;

        this.locked = locked ?? false;
        this.seriesRect = seriesRect;

        this.isHorizontal = HorizontalLineAnnotation.is(datum);
        const axisContext = this.isHorizontal ? context.yAxis : context.xAxis;

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
            strokeWidth: datum.handle.strokeWidth ?? strokeWidth,
        };

        const x = x1 + (x2 - x1) / 2;
        const y = y1 + (y2 - y1) / 2;
        const { width: handleWidth, height: handleHeight } = middle.handle;
        middle.gradient = this.isHorizontal ? 'horizontal' : 'vertical';
        middle.update({ ...handleStyles, x: x - handleWidth / 2, y: y - handleHeight / 2 });

        middle.toggleLocked(this.locked);

        this.updateAxisLabel(datum, axisContext, coords);
    }

    private createAxisLabel(context: AnnotationAxisContext) {
        const axisLabel = new AxisLabel();
        context.attachLabel(axisLabel);
        return axisLabel;
    }

    private updateAxisLabel(
        datum: CrossLineAnnotation,
        axisContext: AnnotationAxisContext,
        { x1, y1, x2, y2 }: LineCoords
    ) {
        if (!this.axisLabel) {
            this.axisLabel = this.createAxisLabel(axisContext);
        }

        const { axisLabel, seriesRect } = this;
        if (datum.axisLabel.enabled) {
            axisLabel.visible = this.visible;

            const [labelX, labelY] =
                axisContext.position === 'left' || axisContext.position === 'top' ? [x1, y1] : [x2, y2];

            const labelPosition = axisContext.direction === ChartAxisDirection.X ? labelX : labelY;
            if (!axisContext.inRange(labelPosition)) {
                axisLabel.visible = false;
                return;
            }

            axisLabel.update({
                x: labelX + (seriesRect?.x ?? 0),
                y: labelY + (seriesRect?.y ?? 0),
                value: datum.value,
                styles: datum.axisLabel,
                context: axisContext,
            });
        } else {
            axisLabel.visible = false;
        }
    }

    public toggleHandles(show: boolean) {
        this.middle.visible = show;
        this.middle.toggleHovered(this.activeHandle === 'middle');
    }

    public override destroy(): void {
        super.destroy();
        this.axisLabel?.destroy();
    }

    public toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.middle.toggleActive(active);
    }

    public dragStart(datum: CrossLineAnnotation, target: Coords, context: AnnotationContext) {
        const middle = HorizontalLineAnnotation.is(datum)
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

        const isHorizontal = HorizontalLineAnnotation.is(datum);
        datum.set({ value: isHorizontal ? point.y : point.x });
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
        let bbox = this.getCachedBBoxWithoutHandles();

        // Since crosslines are created in a single click, the anchor is required before their first render and
        // caching of the bbox. So force a computation of it here.
        if (bbox.width === 0 && bbox.height === 0) {
            bbox = this.computeBBoxWithoutHandles();
        }

        if (this.isHorizontal) {
            return { x: bbox.x + bbox.width / 2, y: bbox.y };
        }

        return { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2, position: 'above' };
    }

    private convertCrossLine(datum: CrossLineAnnotation, context: AnnotationAxisContext) {
        if (datum.value == null) return;

        let x1 = 0;
        let x2 = 0;
        let y1 = 0;
        let y2 = 0;

        const { bounds, scaleConvert, scaleBandwidth } = context;
        const halfBandwidth = (scaleBandwidth() ?? 0) / 2;

        if (HorizontalLineAnnotation.is(datum)) {
            const scaledValue = scaleConvert(datum.value) + halfBandwidth;
            x2 = bounds.width;
            y1 = scaledValue;
            y2 = scaledValue;
        } else {
            const scaledValue = scaleConvert(datum.value) + halfBandwidth;
            x1 = scaledValue;
            x2 = scaledValue;
            y2 = bounds.height;
        }

        return { x1, y1, x2, y2 };
    }
}
