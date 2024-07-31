import { _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType, type Bounds, type Coords, type LineCoords } from '../annotationTypes';
import { convertLine } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualStartEndScene } from '../scenes/textualStartEndScene';
import type { CalloutProperties } from './calloutProperties';

const { drawCorner } = _Scene;

const DEFAULT_PADDING = {
    top: 6,
    right: 12,
    bottom: 9,
    left: 12,
};

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

type PathType = 'corner' | 'side' | 'calloutCorner' | 'calloutSide';

export class CalloutScene extends TextualStartEndScene<CalloutProperties> {
    static override is(value: unknown): value is CalloutScene {
        return AnnotationScene.isCheck(value, AnnotationType.Callout);
    }

    override type = AnnotationType.Callout;

    private readonly shape = new _Scene.Path();
    private padding = DEFAULT_PADDING;

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
            x: bodyBounds.x + this.padding.left,
            y: bodyBounds.y - this.padding.bottom - datum.fontSize / 2,
        };
    }

    protected override getHandleStyles(datum: CalloutProperties, handle: 'start' | 'end') {
        return handle === 'start'
            ? {
                  fill: datum.handle.fill,
                  stroke: datum.handle.stroke ?? datum.stroke,
                  strokeOpacity: datum.handle.strokeOpacity,
                  strokeWidth: datum.handle.strokeWidth,
              }
            : { fill: undefined, strokeWidth: 0 };
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
        const cornerRadius = 8;

        const pathParams: { coordinates: _Scene.Corner; type: PathType }[] = [
            {
                coordinates: {
                    x0: x,
                    x1: x + cornerRadius,
                    y0: top + cornerRadius,
                    y1: top,
                    cx: placement === `topLeft` ? tailX : x + cornerRadius,
                    cy: placement === `topLeft` ? tailY : top + cornerRadius,
                },
                type: placement === `topLeft` ? 'calloutCorner' : 'corner',
            },
            {
                coordinates: {
                    x0: x + cornerRadius,
                    x1: right - cornerRadius,
                    y0: top,
                    y1: top,
                    cx: tailX,
                    cy: tailY,
                },
                type: placement === `top` ? 'calloutSide' : 'side',
            },
            {
                coordinates: {
                    x0: right - cornerRadius,
                    x1: right,
                    y0: top,
                    y1: top + cornerRadius,
                    cx: placement === `topRight` ? tailX : right - cornerRadius,
                    cy: placement === `topRight` ? tailY : top + cornerRadius,
                },
                type: placement === `topRight` ? 'calloutCorner' : 'corner',
            },
            {
                coordinates: {
                    x0: right,
                    x1: right,
                    y0: top + cornerRadius,
                    y1: y - cornerRadius,
                    cx: tailX,
                    cy: tailY,
                },
                type: placement === `right` ? 'calloutSide' : 'side',
            },
            {
                coordinates: {
                    x0: right,
                    x1: right - cornerRadius,
                    y0: y - cornerRadius,
                    y1: y,
                    cx: placement === `bottomRight` ? tailX : right - cornerRadius,
                    cy: placement === `bottomRight` ? tailY : y - cornerRadius,
                },
                type: placement === `bottomRight` ? 'calloutCorner' : 'corner',
            },
            {
                coordinates: {
                    x0: right - cornerRadius,
                    x1: x + cornerRadius,
                    y0: y,
                    y1: y,
                    cx: tailX,
                    cy: tailY,
                },
                type: placement === `bottom` ? 'calloutSide' : 'side',
            },
            {
                coordinates: {
                    x0: x + cornerRadius,
                    x1: x,
                    y0: y,
                    y1: y - cornerRadius,
                    cx: placement === `bottomLeft` ? tailX : x + cornerRadius,
                    cy: placement === `bottomLeft` ? tailY : y - cornerRadius,
                },
                type: placement === `bottomLeft` ? 'calloutCorner' : 'corner',
            },
            {
                coordinates: {
                    x0: x,
                    x1: x,
                    y0: y - cornerRadius,
                    y1: top + cornerRadius,
                    cx: tailX,
                    cy: tailY,
                },
                type: placement === `left` ? 'calloutSide' : 'side',
            },
        ];

        const { path } = this.shape;
        path.clear();
        path.moveTo(x, top + cornerRadius);

        pathParams.forEach(({ coordinates, type }) => {
            this.drawPath(path, coordinates, cornerRadius, type);
        });

        path.closePath();
    }

    drawPath(
        path: _Scene.ExtendedPath2D,
        { x0, y0, x1, y1, cx, cy }: _Scene.Corner,
        cornerRadius: number,
        type: PathType
    ) {
        const sideTailRadius = 6;

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

                    path.lineTo(midX - sideTailRadius * direction, y0);
                    path.lineTo(cx, cy);
                    path.lineTo(midX + sideTailRadius * direction, y0);
                    path.lineTo(x1, y1);
                } else {
                    const direction = y0 > y1 ? -1 : 1;
                    const midY = Math.min(y0, y1) + Math.abs(y0 - y1) / 2;

                    path.lineTo(x0, midY - sideTailRadius * direction);
                    path.lineTo(cx, cy);
                    path.lineTo(x0, midY + sideTailRadius * direction);
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
        const { fontSize } = datum;

        const horizontalPadding = this.padding.left + this.padding.right;
        const verticalPadding = this.padding.top + this.padding.bottom;

        const width = textBBox.width + horizontalPadding;
        const height = Math.max(textBBox.height + verticalPadding, fontSize + verticalPadding);

        return {
            tailPoint: {
                x: coords.x1,
                y: coords.y1,
            },
            bodyBounds: {
                x: textBBox.x - padding,
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
