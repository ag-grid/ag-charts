import { _ModuleSupport, type _Scene } from 'ag-charts-community';

import type { AnnotationAxisContext, AnnotationContext } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { AxisLabelScene } from '../scenes/axisLabelScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import type { CollidableText } from '../scenes/collidableTextScene';
import { UnivariantHandle } from '../scenes/handle';
import { LineWithTextScene } from '../scenes/lineWithTextScene';
import { convert, invert, invertCoords } from '../utils/values';
import { type CrossLineProperties, HorizontalLineProperties } from './crossLineProperties';

const { ChartAxisDirection, Vec2, Vec4 } = _ModuleSupport;

export class CrossLineScene extends AnnotationScene {
    static override is(value: unknown): value is CrossLineScene {
        return AnnotationScene.isCheck(value, 'cross-line');
    }

    type = 'cross-line';

    override activeHandle?: 'middle';

    private readonly line = new CollidableLine();
    private readonly middle = new UnivariantHandle();
    private axisLabel?: AxisLabelScene;
    public text?: CollidableText;

    private seriesRect?: _Scene.BBox;
    private dragState?: {
        offset: _ModuleSupport.Vec2;
        middle: _ModuleSupport.Vec2;
    };
    private isHorizontal = false;

    constructor() {
        super();
        this.append([this.line, this.middle]);
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

    private updateLine(datum: CrossLineProperties, coords: _ModuleSupport.Vec4) {
        const { line } = this;
        const { lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
        const { x1, y1, x2, y2 } = coords;

        line.setProperties({
            x1,
            y1,
            x2,
            y2,
            lineCap: datum.getLineCap(),
            lineDash: datum.getLineDash(),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
        });
    }

    private updateHandle(datum: CrossLineProperties, coords: _ModuleSupport.Vec4) {
        const { middle } = this;
        const { locked, stroke, strokeWidth, strokeOpacity } = datum;

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? strokeOpacity,
            strokeWidth: datum.handle.strokeWidth ?? strokeWidth,
        };

        const handlePosition = Vec2.sub(
            Vec4.center(coords),
            Vec2.from(middle.handle.width / 2, middle.handle.height / 2)
        );

        middle.gradient = this.isHorizontal ? 'horizontal' : 'vertical';
        middle.update({ ...handleStyles, ...handlePosition });

        middle.toggleLocked(locked ?? false);
    }

    private updateText(datum: CrossLineProperties, coords: _ModuleSupport.Vec4) {
        LineWithTextScene.updateLineText.call(this, this.line, datum, coords);
    }

    private createAxisLabel(context: AnnotationAxisContext) {
        const axisLabel = new AxisLabelScene();
        context.attachLabel(axisLabel);
        return axisLabel;
    }

    private updateAxisLabel(
        datum: CrossLineProperties,
        axisContext: AnnotationAxisContext,
        coords: _ModuleSupport.Vec4
    ) {
        if (!this.axisLabel) {
            this.axisLabel = this.createAxisLabel(axisContext);
        }

        const { axisLabel, seriesRect } = this;
        const { direction, position } = axisContext;
        if (datum.axisLabel.enabled) {
            axisLabel.visible = this.visible;

            const labelCorner = position === 'left' || position === 'top' ? Vec4.start(coords) : Vec4.end(coords);
            const labelPosition = direction === ChartAxisDirection.X ? labelCorner.x : labelCorner.y;

            if (!axisContext.inRange(labelPosition)) {
                axisLabel.visible = false;
                return;
            }

            axisLabel.update({
                ...Vec2.add(labelCorner, Vec2.required(seriesRect)),
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

    public dragStart(datum: CrossLineProperties, target: _ModuleSupport.Vec2, context: AnnotationContext) {
        const middle = HorizontalLineProperties.is(datum)
            ? { x: target.x, y: convert(datum.value, context.yAxis) }
            : { x: convert(datum.value, context.xAxis), y: target.y };

        this.dragState = {
            offset: target,
            middle,
        };
    }

    public drag(datum: CrossLineProperties, target: _ModuleSupport.Vec2, context: AnnotationContext) {
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

    public translate(datum: CrossLineProperties, { x, y }: _ModuleSupport.Vec2, context: AnnotationContext) {
        if (datum.locked) return;

        const { axisContext, translation } = HorizontalLineProperties.is(datum)
            ? { axisContext: context.yAxis, translation: y }
            : { axisContext: context.xAxis, translation: x };

        const translated = convert(datum.value, axisContext) + translation;
        const value = invert(translated, axisContext);

        if (!isNaN(value)) datum.set({ value });
    }

    override stopDragging() {
        this.middle.toggleDragging(false);
    }

    public copy(datum: CrossLineProperties, copiedDatum: CrossLineProperties, context: AnnotationContext) {
        const isHorizontal = HorizontalLineProperties.is(datum);
        const axisContext = this.isHorizontal ? context.yAxis : context.xAxis;

        const coords = this.convertCrossLine(datum, axisContext);
        if (!coords) {
            return;
        }

        const yOffset = isHorizontal ? -30 : 0;
        const xOffset = isHorizontal ? 0 : -30;

        const point = invertCoords({ x: coords.x1 + xOffset, y: coords.y1 + yOffset }, context);

        copiedDatum.set({ value: isHorizontal ? point.y : point.x });

        return copiedDatum;
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return this[this.activeHandle].getCursor();
    }

    override containsPoint(x: number, y: number) {
        const { middle, line, text } = this;

        this.activeHandle = undefined;

        if (middle.containsPoint(x, y)) {
            this.activeHandle = 'middle';
            return true;
        }

        return line.isPointInPath(x, y) || Boolean(text?.containsPoint(x, y));
    }

    override getNodeAtCoords(x: number, y: number) {
        if (this.text?.containsPoint(x, y)) return 'text';

        if (this.line.isPointInPath(x, y)) return 'line';

        if (this.middle.containsPoint(x, y)) return 'handle';
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
