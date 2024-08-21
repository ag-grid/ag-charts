import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationAxisContext, AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { convert, invertCoords } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
import { AxisLabelScene } from '../scenes/axisLabelScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import { UnivariantHandle } from '../scenes/handle';
import { LineWithTextScene } from '../scenes/lineWithTextScene';
import { type CrossLineProperties, HorizontalLineProperties } from './crossLineProperties';

const { Vec2 } = _Util;
const { ChartAxisDirection } = _ModuleSupport;

export class CrossLineScene extends AnnotationScene {
    static override is(value: unknown): value is CrossLineScene {
        return AnnotationScene.isCheck(value, 'cross-line');
    }

    type = 'cross-line';

    override activeHandle?: 'middle';

    private readonly line = new CollidableLine();
    public readonly lineClipGroup = new _Scene.Group({ name: 'CrossLineSceneClipGroup' });
    private readonly middle = new UnivariantHandle();
    private axisLabel?: AxisLabelScene;
    public text?: _Scene.TransformableText;

    private seriesRect?: _Scene.BBox;
    private dragState?: {
        offset: Coords;
        middle: Coords;
    };
    private isHorizontal = false;

    constructor() {
        super();
        this.lineClipGroup.append(this.line);
        this.append([this.lineClipGroup, this.middle]);
    }

    public update(datum: CrossLineProperties, context: AnnotationContext) {
        const { seriesRect } = context;
        this.seriesRect = seriesRect;

        this.isHorizontal = HorizontalLineProperties.is(datum);
        const axisContext = this.isHorizontal ? context.yAxis : context.xAxis;

        const coords = this.convertCrossLine(datum, axisContext);

        if (coords == null) {
            this.visible = false;
            return;
        }

        this.visible = datum.visible ?? true;
        if (!this.visible) return;

        this.updateLine(datum, coords);
        this.updateHandle(datum, coords);
        this.updateText(datum, coords);
        this.updateAxisLabel(datum, axisContext, coords);
    }

    private updateLine(datum: CrossLineProperties, coords: LineCoords) {
        const { line } = this;
        const { lineDashOffset, stroke, strokeWidth, strokeOpacity, lineCap } = datum;
        const { x1, y1, x2, y2 } = coords;

        line.setProperties({
            x1,
            y1,
            x2,
            y2,
            lineDash: datum.getLineDash(),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
            lineCap,
        });
        line.updateCollisionBBox();
    }

    private updateHandle(datum: CrossLineProperties, coords: LineCoords) {
        const { middle } = this;
        const { locked, stroke, strokeWidth, strokeOpacity } = datum;
        const { x1, y1, x2, y2 } = coords;

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

        middle.toggleLocked(locked ?? false);
    }

    private readonly updateText = LineWithTextScene.updateLineText.bind(this);

    private createAxisLabel(context: AnnotationAxisContext) {
        const axisLabel = new AxisLabelScene();
        context.attachLabel(axisLabel);
        return axisLabel;
    }

    private updateAxisLabel(
        datum: CrossLineProperties,
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

    public dragStart(datum: CrossLineProperties, target: Coords, context: AnnotationContext) {
        const middle = HorizontalLineProperties.is(datum)
            ? { x: target.x, y: convert(datum.value, context.yAxis) }
            : { x: convert(datum.value, context.xAxis), y: target.y };

        this.dragState = {
            offset: target,
            middle,
        };
    }

    public drag(datum: CrossLineProperties, target: Coords, context: AnnotationContext) {
        const { activeHandle, dragState } = this;

        if (datum.locked) return;

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

        const isHorizontal = HorizontalLineProperties.is(datum);
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
        const { middle, line } = this;

        this.activeHandle = undefined;

        if (middle.containsPoint(x, y)) {
            this.activeHandle = 'middle';
            return true;
        }

        return line.isPointInPath(x, y);
    }

    override getAnchor() {
        const bbox = this.computeBBoxWithoutHandles();

        if (this.isHorizontal) {
            return { x: bbox.x + bbox.width / 2, y: bbox.y };
        }

        return { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2, position: 'right' as const };
    }

    private convertCrossLine(datum: CrossLineProperties, context: AnnotationAxisContext) {
        if (datum.value == null) return;

        let x1 = 0;
        let x2 = 0;
        let y1 = 0;
        let y2 = 0;

        const { bounds, scaleConvert, scaleBandwidth } = context;
        const halfBandwidth = (scaleBandwidth() ?? 0) / 2;

        if (HorizontalLineProperties.is(datum)) {
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
