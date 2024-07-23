import { _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType, type Coords } from '../annotationTypes';
import { invertCoords, validateDatumPoint } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { LinearScene } from '../scenes/linearScene';
import type { CalloutDimensions, CalloutProperties } from './calloutProperties';

const { drawCorner } = _Scene;

export class CalloutScene extends LinearScene<CalloutProperties> {
    static override is(value: unknown): value is CalloutScene {
        return AnnotationScene.isCheck(value, AnnotationType.Callout);
    }

    override type = AnnotationType.Callout;

    protected readonly label = new _Scene.Text({ zIndex: 1 });
    protected readonly start = new DivariantHandle();

    override activeHandle?: 'start' | 'end';

    public update(datum: CalloutProperties, context: AnnotationContext) {
        this.padding = datum.padding ?? 20;
        this.label.opacity = datum.visible ? 1 : 0;

        this.label.text = datum.text; // need this for measuring width/height of text to update shape and handle
        const labelBBox = this.label.computeBBox();
        const dimensions = datum.getDimensions(labelBBox, context);

        this.updateHandle(datum, dimensions);
        this.updateShape(datum, dimensions);

        const shapeBounds = dimensions?.bodyBounds;
        if (!shapeBounds) {
            console.log('no bounds');
            return;
        }
        labelBBox.x = shapeBounds.x + (datum.padding ?? 20) / 2;
        labelBBox.y = shapeBounds.y;
        labelBBox.width = shapeBounds.width;
        labelBBox.height = shapeBounds.height;
        this.updateLabel(datum, labelBBox);
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return 'default';
    }

    protected updateLabel(datum: CalloutProperties, textBBox: _Scene.BBox) {
        this.label.x = textBBox.x;
        this.label.y = textBBox.y - textBBox.height / 2;

        this.label.text = datum.text;
        this.label.fill = datum.color;
        this.label.fontFamily = datum.fontFamily;
        this.label.fontSize = datum.fontSize;
        this.label.fontStyle = datum.fontStyle;
        this.label.fontWeight = datum.fontWeight;
        this.label.textBaseline = 'middle';

        datum.textBBox = this.label.computeBBox();
    }

    private readonly shape = new _Scene.Path();
    private padding = 0;
    private readonly end = new DivariantHandle();

    constructor() {
        super();
        this.append([this.shape, this.label, this.start, this.end]);
    }

    protected updateHandle(datum: CalloutProperties, dimensions?: CalloutDimensions) {
        const styles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.fill,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };

        const { tailPoint, bodyBounds } = dimensions ?? {};

        if (!tailPoint || !bodyBounds) {
            this.visible = false;
            return;
        }

        this.start.update({ ...styles, x: tailPoint.x, y: tailPoint.y });
        this.end.update({
            fill: undefined,
            strokeWidth: 0,
            x: bodyBounds.x + bodyBounds.width / 2,
            y: bodyBounds.y - bodyBounds.height / 2,
        });

        this.start.toggleLocked(datum.locked ?? false);
        this.end.toggleLocked(datum.locked ?? false);
    }

    protected updateShape(datum: CalloutProperties, dimensions?: CalloutDimensions) {
        const { shape } = this;

        // update shape styles
        shape.fill = datum.fill;
        shape.fillOpacity = datum.fillOpacity ?? 1;
        shape.stroke = datum.stroke;
        shape.strokeWidth = datum.strokeWidth ?? 1;
        shape.strokeOpacity = datum.strokeOpacity ?? 1;

        // update shape path

        const { tailPoint, bodyBounds } = dimensions ?? {};

        if (!tailPoint || !bodyBounds) {
            return;
        }

        this.updatePath(tailPoint, bodyBounds);
    }

    override getAnchor() {
        const bbox = this.getCachedBBoxWithoutHandles();
        return { x: bbox.x - this.padding / 2, y: bbox.y - 35, position: 'above-left' as const };
    }

    private updatePath(anchorPoint: Coords, shapeBounds: { x: number; y: number; width: number; height: number }) {
        // anchor at bottom left
        const { x: x1, y: y1 } = anchorPoint;
        const { x: x2, y: y2, width, height } = shapeBounds;
        const x = x2;
        const y = y2;

        const top = y - height;
        const right = x + width;

        const placement = this.calculateCalloutPlacement({ x: x1, y: y1 }, shapeBounds);
        const cornerRadius = Math.min(12, Math.min(width, height) / 2);

        const { path } = this.shape;
        path.clear();

        path.moveTo(x, top + cornerRadius);
        this.drawPath(
            path,
            {
                x0: x,
                x1: x + cornerRadius,
                y0: top + cornerRadius,
                y1: top,
                cx: placement === `topLeft` ? x1 : x + cornerRadius,
                cy: placement === `topLeft` ? y1 : top + cornerRadius,
            },
            cornerRadius,
            placement === `topLeft` ? 'calloutCorner' : 'corner'
        );

        this.drawPath(
            path,
            {
                x0: x + cornerRadius,
                x1: right - cornerRadius,
                y0: top,
                y1: top,
                cx: x1,
                cy: y1,
            },
            cornerRadius,
            placement === `top` ? 'calloutSide' : 'side'
        );

        this.drawPath(
            path,
            {
                x0: right - cornerRadius,
                x1: right,
                y0: top,
                y1: top + cornerRadius,
                cx: placement === `topRight` ? x1 : right - cornerRadius,
                cy: placement === `topRight` ? y1 : top + cornerRadius,
            },
            cornerRadius,
            placement === `topRight` ? 'calloutCorner' : 'corner'
        );

        this.drawPath(
            path,
            {
                x0: right,
                x1: right,
                y0: top + cornerRadius,
                y1: y - cornerRadius,
                cx: x1,
                cy: y1,
            },
            cornerRadius,
            placement === `right` ? 'calloutSide' : 'side'
        );

        this.drawPath(
            path,
            {
                x0: right,
                x1: right - cornerRadius,
                y0: y - cornerRadius,
                y1: y,
                cx: placement === `bottomRight` ? x1 : right - cornerRadius,
                cy: placement === `bottomRight` ? y1 : y - cornerRadius,
            },
            cornerRadius,
            placement === `bottomRight` ? 'calloutCorner' : 'corner'
        );

        this.drawPath(
            path,
            {
                x0: right - cornerRadius,
                x1: x + cornerRadius,
                y0: y,
                y1: y,
                cx: x1,
                cy: y1,
            },
            cornerRadius,
            placement === `bottom` ? 'calloutSide' : 'side'
        );

        this.drawPath(
            path,
            {
                x0: x + cornerRadius,
                x1: x,
                y0: y,
                y1: y - cornerRadius,
                cx: placement === `bottomLeft` ? x1 : x + cornerRadius,
                cy: placement === `bottomLeft` ? y1 : y - cornerRadius,
            },
            cornerRadius,
            placement === `bottomLeft` ? 'calloutCorner' : 'corner'
        );

        this.drawPath(
            path,
            {
                x0: x,
                x1: x,
                y0: y - cornerRadius,
                y1: top + cornerRadius,
                cx: x1,
                cy: y1,
            },
            cornerRadius,
            placement === `left` ? 'calloutSide' : 'side'
        );

        path.closePath();
    }

    private calculateCalloutPlacement(
        anchorPoint: Coords,
        bounds: { x: number; y: number; width: number; height: number }
    ) {
        // rect x and y are bottom left corner of rect
        const right = bounds.x + bounds.width;
        const top = bounds.y - bounds.height;

        let xPlacement;
        let yPlacement;

        if (anchorPoint.x > right) {
            xPlacement = 'right';
        } else if (anchorPoint.x < bounds.x) {
            xPlacement = 'left';
        }

        if (anchorPoint.y > bounds.y) {
            yPlacement = 'bottom';
        } else if (anchorPoint.y < top) {
            yPlacement = 'top';
        }

        if (xPlacement && yPlacement) {
            return `${yPlacement}${xPlacement[0].toUpperCase()}${xPlacement.substring(1)}`;
        } else {
            return yPlacement ?? xPlacement;
        }
    }

    drawPath(
        path: _Scene.ExtendedPath2D,
        { x0, y0, x1, y1, cx, cy }: _Scene.Corner,
        cornerRadius: number,
        type: 'corner' | 'side' | 'calloutCorner' | 'calloutSide'
    ) {
        const halfCornerRadius = cornerRadius / 2;
        switch (type) {
            case 'calloutCorner': {
                path.lineTo(cx, cy);
                path.lineTo(x1, y1);
                break;
            }
            case 'corner': {
                drawCorner(
                    path,
                    {
                        x0,
                        x1,
                        y0,
                        y1,
                        cx,
                        cy,
                    },
                    cornerRadius,
                    false
                );
                break;
            }
            case 'calloutSide': {
                if (x0 !== x1) {
                    const direction = x0 > x1 ? -1 : 1;
                    const midX = Math.min(x0, x1) + Math.abs(x1 - x0) / 2;

                    path.lineTo(midX - halfCornerRadius * direction, y0);
                    path.lineTo(cx, cy);
                    path.lineTo(midX + halfCornerRadius * direction, y0);
                    path.lineTo(x1, y1);
                } else {
                    const direction = y0 > y1 ? -1 : 1;
                    const midY = Math.min(y0, y1) + Math.abs(y0 - y1) / 2;

                    path.lineTo(x0, midY - halfCornerRadius * direction);
                    path.lineTo(cx, cy);
                    path.lineTo(x0, midY + halfCornerRadius * direction);
                    path.lineTo(x1, y1);
                }
                break;
            }
            case 'side':
            default: {
                path.lineTo(x1, y1);
                break;
            }
        }
    }

    override toggleHandles(show: boolean | Partial<Record<'start' | 'end', boolean>>) {
        if (typeof show === 'boolean') {
            show = { start: show, end: show };
        }

        this.start.visible = show.start ?? true;
        this.end.visible = show.end ?? true;

        this.start.toggleHovered(this.activeHandle === 'start');
        this.end.toggleHovered(this.activeHandle === 'end');
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.start.toggleActive(active);
        this.end.toggleActive(active);
    }

    override drag(datum: CalloutProperties, target: Coords, context: AnnotationContext) {
        if (datum.locked) return;

        if (this.activeHandle === 'end') {
            this.dragHandle(datum, target, context);
        } else {
            this.dragAll(datum, target, context);
        }
    }

    override dragHandle(datum: CalloutProperties, target: Coords, context: AnnotationContext) {
        const { activeHandle } = this;

        if (!activeHandle) return;

        this[activeHandle].toggleDragging(true);
        const point = invertCoords(this[activeHandle].drag(target).point, context);

        if (!validateDatumPoint(context, point)) return;

        datum[activeHandle].x = point.x;
        datum[activeHandle].y = point.y;
    }

    override stopDragging() {
        this.start.toggleDragging(false);
        this.end.toggleDragging(false);
    }

    override containsPoint(x: number, y: number) {
        const { start, end, shape } = this;

        this.activeHandle = undefined;

        if (start.containsPoint(x, y)) {
            this.activeHandle = 'start';
            return true;
        }

        const shapeContainsPoint = shape.containsPoint(x, y);
        if (end.containsPoint(x, y) || shapeContainsPoint) {
            this.activeHandle = 'end';
            return true;
        }

        return shapeContainsPoint;
    }
}
