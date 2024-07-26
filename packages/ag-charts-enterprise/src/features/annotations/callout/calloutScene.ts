import { _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType, type Bounds, type Coords, type LineCoords } from '../annotationTypes';
import { convertLine } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualStartEndScene } from '../scenes/textualStartEndScene';
import type { CalloutProperties } from './calloutProperties';

const { drawCorner } = _Scene;

interface CalloutDimensions {
    tailPoint: {
        x: number;
        y: number;
    };
    bodyBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export class CalloutScene extends TextualStartEndScene<CalloutProperties> {
    static override is(value: unknown): value is CalloutScene {
        return AnnotationScene.isCheck(value, AnnotationType.Callout);
    }

    override type = AnnotationType.Callout;

    private readonly shape = new _Scene.Path();

    constructor() {
        super();
        this.append([this.shape, this.label, this.start, this.end]);
    }

    override drag(datum: CalloutProperties, target: Coords, context: AnnotationContext) {
        if (datum.locked) return;

        if (this.activeHandle === 'end') {
            this.dragHandle(datum, target, context);
        } else {
            this.dragAll(datum, target, context);
        }
    }

    protected override getLabelCoords(datum: CalloutProperties, bbox: _Scene.BBox, coords: LineCoords): _Util.Vec2 {
        const {
            bodyBounds = {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            },
        } = this.getDimensions(datum, bbox, coords) ?? {};

        return {
            x: bodyBounds.x + (datum.padding ?? 10),
            y: bodyBounds.y - bodyBounds.height / 2,
        };
    }

    protected override getHandleStyles(datum: CalloutProperties, handle: 'start' | 'end') {
        return handle === 'start' ? super.getHandleStyles(datum, handle) : { fill: undefined, strokeWidth: 0 };
    }

    protected override updateAnchor(datum: CalloutProperties, bbox: _Scene.BBox, context: AnnotationContext) {
        const coords = convertLine(datum, context);
        if (!coords) {
            return this.anchor;
        }
        const { bodyBounds } = this.getDimensions(datum, bbox, coords) ?? {};
        const bounds = bodyBounds ?? bbox;
        return {
            x: bounds.x + context.seriesRect.x,
            y: bounds.y + context.seriesRect.y - bounds.height,
            position: this.anchor.position,
        };
    }

    protected override updateShape(datum: CalloutProperties, textBBox: _Scene.BBox, coords: LineCoords) {
        const { shape } = this;

        // update shape styles
        shape.fill = datum.fill;
        shape.fillOpacity = datum.fillOpacity ?? 1;
        shape.stroke = datum.stroke;
        shape.strokeWidth = datum.strokeWidth ?? 1;
        shape.strokeOpacity = datum.strokeOpacity ?? 1;

        // update shape path

        const { tailPoint, bodyBounds } = this.getDimensions(datum, textBBox, coords) ?? {};
        if (!tailPoint || !bodyBounds) {
            return;
        }

        this.updatePath(tailPoint, bodyBounds);
    }

    private updatePath(tailPoint: Coords, bodyBounds: Bounds) {
        const { x: tailX, y: tailY } = tailPoint;
        const { x, y, width, height } = bodyBounds;

        const top = y - height;
        const right = x + width;

        const placement = this.calculateCalloutPlacement({ x: tailX, y: tailY }, bodyBounds);
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
                cx: placement === `topLeft` ? tailX : x + cornerRadius,
                cy: placement === `topLeft` ? tailY : top + cornerRadius,
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
                cx: tailX,
                cy: tailY,
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
                cx: placement === `topRight` ? tailX : right - cornerRadius,
                cy: placement === `topRight` ? tailY : top + cornerRadius,
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
                cx: tailX,
                cy: tailY,
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
                cx: placement === `bottomRight` ? tailX : right - cornerRadius,
                cy: placement === `bottomRight` ? tailY : y - cornerRadius,
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
                cx: tailX,
                cy: tailY,
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
                cx: placement === `bottomLeft` ? tailX : x + cornerRadius,
                cy: placement === `bottomLeft` ? tailY : y - cornerRadius,
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
                cx: tailX,
                cy: tailY,
            },
            cornerRadius,
            placement === `left` ? 'calloutSide' : 'side'
        );

        path.closePath();
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

    private calculateCalloutPlacement(
        anchorPoint: Coords,
        bounds: { x: number; y: number; width: number; height: number }
    ) {
        // bounds x and y are bottom left corner
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

    public getDimensions(
        datum: CalloutProperties,
        textBBox: _Scene.BBox,
        coords: LineCoords
    ): CalloutDimensions | undefined {
        const { padding = 10, fontSize } = datum;
        const doublePadding = padding * 2;

        const width = textBBox.width + doublePadding;
        const height = Math.max(textBBox.height + doublePadding, fontSize + doublePadding);

        return {
            tailPoint: {
                x: coords.x1,
                y: coords.y1,
            },
            bodyBounds: {
                x: textBBox.x - width / 2,
                y: textBBox.y + height / 2,
                width,
                height,
            },
        };
    }

    override containsPoint(x: number, y: number) {
        const { start, end, shape } = this;

        this.activeHandle = undefined;

        if (start.containsPoint(x, y)) {
            this.activeHandle = 'start';
            return true;
        }

        const bodyContainsPoint = end.containsPoint(x, y) || shape.containsPoint(x, y);
        if (bodyContainsPoint) {
            this.activeHandle = 'end';
        }

        return bodyContainsPoint;
    }
}
