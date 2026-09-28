import { _ModuleSupport } from 'ag-charts-community';
import { Color, type Point, calcLineHeight } from 'ag-charts-core';

import { type AnnotationContext, AnnotationType, type Padding } from '../annotationTypes';
import type { TextualPointDatum } from '../datum/textualDatum';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualPointScene } from '../scenes/textualPointScene';
import { ANNOTATION_TEXT_LINE_HEIGHT, uniformPadding } from '../text/util';
import type { CommentDatum } from './commentDatum';

const { drawCorner } = _ModuleSupport;

const DEFAULT_COMMENT_PADDING = {
    top: 8,
    right: 14,
    bottom: 8,
    left: 14,
};

export class CommentScene extends TextualPointScene<CommentDatum> {
    static override is(value: unknown): value is CommentScene {
        return AnnotationScene.isCheck(value, AnnotationType.Comment);
    }

    override type = AnnotationType.Comment;

    protected override readonly textPosition = 'bottom' as const;
    protected override readonly textAlignment = 'left' as const;

    private readonly shape = new _ModuleSupport.Path();

    constructor() {
        super();
        this.append([this.shape, this.label, this.handle]);
    }

    public override getPlaceholderColor(datum: TextualPointDatum) {
        const { r, g, b } = Color.fromString(datum.color ?? '#888888');
        return new Color(r, g, b, 0.66).toString();
    }

    protected override getTextInputCoords(datum: TextualPointDatum, context: AnnotationContext, height: number) {
        const coords = super.getTextInputCoords(datum, context, height);
        const padding = this.getPadding(datum);

        return {
            x: coords.x + padding.left,
            y: coords.y - padding.bottom,
        };
    }

    protected override getPadding(datum: TextualPointDatum): Padding {
        const { padding, fontSize } = datum;
        if (padding == null) {
            return {
                top: Math.max(fontSize * 0.4, DEFAULT_COMMENT_PADDING.top),
                bottom: Math.max(fontSize * 0.4, DEFAULT_COMMENT_PADDING.bottom),
                left: Math.max(fontSize * 0.8, DEFAULT_COMMENT_PADDING.left),
                right: Math.max(fontSize * 0.8, DEFAULT_COMMENT_PADDING.right),
            };
        }
        return uniformPadding(padding);
    }

    protected override updateShape(datum: CommentDatum, bbox: _ModuleSupport.BBox) {
        const { shape } = this;

        // update shape styles
        shape.fill = datum.fill;
        shape.fillOpacity = datum.fillOpacity ?? 1;
        shape.stroke = datum.stroke ?? 'transparent';
        shape.strokeWidth = datum.strokeWidth ?? 1;
        shape.strokeOpacity = datum.strokeOpacity ?? 1;

        // update shape path
        this.updatePath(datum, bbox);
    }

    protected override getLabelCoords(datum: CommentDatum, point: Point): Point {
        const padding = this.getPadding(datum);
        return {
            x: point.x + padding.left,
            y: point.y - padding.bottom,
        };
    }

    protected override getHandleStyles(datum: CommentDatum) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke ?? datum.fill,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };
    }

    protected override updateAnchor(datum: CommentDatum, bbox: _ModuleSupport.BBox, context: AnnotationContext) {
        const anchor = super.updateAnchor(datum, bbox, context);
        const padding = this.getPadding(datum);
        anchor.y -= padding.bottom + padding.top;
        return anchor;
    }

    private updatePath(datum: CommentDatum, bbox: _ModuleSupport.BBox) {
        const padding = this.getPadding(datum);
        const { x, y } = bbox;
        let { width, height } = bbox;
        const { fontSize } = datum;

        const horizontalPadding = padding.left + padding.right;
        const verticalPadding = padding.top + padding.bottom;

        width = width + horizontalPadding;
        height = Math.max(height + verticalPadding, fontSize + verticalPadding);

        const top = y - height;
        const right = x + width;

        const cornerRadius = (calcLineHeight(fontSize, ANNOTATION_TEXT_LINE_HEIGHT) + verticalPadding) / 2;

        const { path } = this.shape;
        path.clear();

        path.moveTo(x, y);
        path.lineTo(x, top + cornerRadius);
        drawCorner(
            path,
            {
                x0: x,
                x1: x + cornerRadius,
                y0: top + cornerRadius,
                y1: top,
                cx: x + cornerRadius,
                cy: top + cornerRadius,
            },
            cornerRadius,
            false
        );
        path.lineTo(right - cornerRadius, top);
        drawCorner(
            path,
            {
                x0: right - cornerRadius,
                x1: right,
                y0: top,
                y1: top + cornerRadius,
                cx: right - cornerRadius,
                cy: top + cornerRadius,
            },
            cornerRadius,
            false
        );

        path.lineTo(right, y - cornerRadius);
        drawCorner(
            path,
            {
                x0: right,
                x1: right - cornerRadius,
                y0: y - cornerRadius,
                y1: y,
                cx: right - cornerRadius,
                cy: y - cornerRadius,
            },
            cornerRadius,
            false
        );

        path.closePath();
    }

    override containsPoint(x: number, y: number) {
        return super.containsPoint(x, y) || this.shape.containsPoint(x, y);
    }
}
