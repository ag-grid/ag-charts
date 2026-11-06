import { type BBox, type Bounds4, ChartAxisDirection, type Point, Vec2, Vec4 } from 'ag-charts-core';

import type { AnnotationAxisContext, AnnotationContext } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { AxisLabelScene } from '../scenes/axisLabelScene';
import { CollidableLine } from '../scenes/collidableLineScene';
import { CollidableText } from '../scenes/collidableTextScene';
import { UnivariantHandle } from '../scenes/handle';
import { translate } from '../utils/coords';
import { isWriteable } from '../utils/datum';
import { getLineCap, getLineDash } from '../utils/line';
import { updateLineText } from '../utils/lineWithText';
import { type PointType, getGroupingValue } from '../utils/scale';
import { convert, invertCoords } from '../utils/values';
import { type CrossLineDatum, horizontalLineDatum } from './crossLineDatum';
import { isFollowing } from './followValue';

export class CrossLineScene extends AnnotationScene<never> {
    static override is(value: unknown): value is CrossLineScene {
        return AnnotationScene.isCheck(value, 'cross-line');
    }

    type = 'cross-line';

    override activeHandle?: 'middle';

    private readonly line = new CollidableLine();
    private readonly middle = new UnivariantHandle();
    private axisLabel?: AxisLabelScene;
    public text?: CollidableText<never>;

    private seriesRect?: BBox;
    private dragState?: {
        offset: Point;
        middle: Point;
    };
    private isHorizontal = false;

    constructor() {
        super();
        this.append([this.line, this.middle]);
    }

    public update(datum: CrossLineDatum, context: AnnotationContext) {
        const { seriesRect } = context;
        this.seriesRect = seriesRect;

        this.isHorizontal = horizontalLineDatum.is(datum);
        const axisContext = this.isHorizontal ? context.yAxis : context.xAxis;

        const value = this.resolveValue(datum, context);
        const coords = this.convertCrossLine(value, this.isHorizontal, axisContext);

        if (coords == null) {
            this.visible = false;
            // The axis label is attached to the axis rather than to this node, and is made visible before every update.
            if (this.axisLabel) this.axisLabel.visible = false;
            return;
        }

        this.visible = datum.visible ?? true;
        if (!this.visible) return;

        this.updateLine(datum, coords);
        this.updateHandle(datum, coords);
        this.updateText(datum, coords);
        this.updateAxisLabel(datum, value, axisContext, coords);
    }

    /** The value to draw at: the followed datum's value for a followed line, otherwise the stored `value`. */
    private resolveValue(datum: CrossLineDatum, context: AnnotationContext): PointType | undefined {
        if (horizontalLineDatum.is(datum) && datum.follow != null) return context.getFollowedValue(datum.follow);
        return datum.value;
    }

    private updateLine(datum: CrossLineDatum, coords: Bounds4) {
        const { line } = this;
        const { lineDashOffset, stroke, strokeWidth, strokeOpacity } = datum;
        const { x1, y1, x2, y2 } = coords;

        line.setProperties({
            x1,
            y1,
            x2,
            y2,
            lineCap: getLineCap(datum),
            lineDash: getLineDash(datum),
            lineDashOffset,
            stroke,
            strokeWidth,
            strokeOpacity,
            fillOpacity: 0,
        });
    }

    private updateHandle(datum: CrossLineDatum, coords: Bounds4) {
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

        // A followed line cannot be dragged, so its handle takes the locked look
        middle.toggleLocked((locked ?? false) || isFollowing(datum));
    }

    private updateText(datum: CrossLineDatum, coords: Bounds4) {
        this.text = this.updateNode(CollidableText<never>, this.text, datum.text.label !== '');

        updateLineText(this.line.id, this.line, coords, datum.text, this.text, datum.text.label, datum.strokeWidth);
    }

    private createAxisLabel(context: AnnotationAxisContext) {
        const axisLabel = new AxisLabelScene();
        context.attachLabel(axisLabel);
        return axisLabel;
    }

    private updateAxisLabel(
        datum: CrossLineDatum,
        value: PointType | undefined,
        axisContext: AnnotationAxisContext,
        coords: Bounds4
    ) {
        this.axisLabel ??= this.createAxisLabel(axisContext);

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
                value: getGroupingValue(value),
                styles: datum.axisLabel,
                context: axisContext,
            });
        } else {
            axisLabel.visible = false;
        }
    }

    public setAxisLabelOpacity(opacity: number) {
        if (!this.axisLabel) return;
        this.axisLabel.opacity = opacity;
    }

    public setAxisLabelVisible(visible: boolean) {
        if (!this.axisLabel) return;
        this.axisLabel.visible = visible;
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

    public dragStart(datum: CrossLineDatum, target: Point, context: AnnotationContext) {
        const middle = horizontalLineDatum.is(datum)
            ? { x: target.x, y: convert(datum.value, context.yAxis) }
            : { x: convert(datum.value, context.xAxis), y: target.y };

        this.dragState = {
            offset: target,
            middle,
        };
    }

    public drag(datum: CrossLineDatum, target: Point, context: AnnotationContext) {
        const { activeHandle, dragState } = this;

        if (!this.isMovable(datum) || !dragState) return;

        if (activeHandle != null) {
            this[activeHandle].toggleDragging(true);
        }

        this.translatePoint(datum, dragState.middle, Vec2.sub(target, dragState.offset), context);
    }

    public translate(datum: CrossLineDatum, translation: Point, context: AnnotationContext) {
        if (!this.isMovable(datum)) return;

        const vector = horizontalLineDatum.is(datum)
            ? Vec2.from(0, convert(datum.value, context.yAxis))
            : Vec2.from(convert(datum.value, context.xAxis), 0);

        this.translatePoint(datum, vector, translation, context);
    }

    private isMovable(datum: CrossLineDatum) {
        return isWriteable(datum) && !isFollowing(datum);
    }

    protected translatePoint(datum: CrossLineDatum, value: Point, translation: Point, context: AnnotationContext) {
        const isHorizontal = horizontalLineDatum.is(datum);
        if (isHorizontal) {
            translation.x = 0;
        } else {
            translation.y = 0;
        }
        const { point } = translate({ point: value }, translation, context);
        datum.value = isHorizontal ? point.y : point.x;
    }

    override stopDragging() {
        this.middle.toggleDragging(false);
    }

    public copy<D extends CrossLineDatum>(datum: D, copiedDatum: D, context: AnnotationContext): D | undefined {
        // A copy of a followed line would sit exactly on top of it
        if (isFollowing(datum)) return;

        const isHorizontal = horizontalLineDatum.is(datum);
        const axisContext = isHorizontal ? context.yAxis : context.xAxis;

        const coords = this.convertCrossLine(datum.value, isHorizontal, axisContext);
        if (!coords) {
            return;
        }

        const yOffset = isHorizontal ? -30 : 0;
        const xOffset = isHorizontal ? 0 : -30;

        const point = invertCoords({ x: coords.x1 + xOffset, y: coords.y1 + yOffset }, context);

        copiedDatum.value = isHorizontal ? point.y : point.x;

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

    private convertCrossLine(value: PointType | undefined, isHorizontal: boolean, context: AnnotationAxisContext) {
        if (value == null) return;

        let x1 = 0;
        let y1 = 0;
        let x2: number, y2: number;

        const { bounds } = context;
        const scaledValue = convert(value, context);

        if (isHorizontal) {
            x2 = bounds.width;
            y1 = scaledValue;
            y2 = scaledValue;
        } else {
            x1 = scaledValue;
            x2 = scaledValue;
            y2 = bounds.height;
        }

        return { x1, y1, x2, y2 };
    }
}
