import { _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualPointScene } from '../scenes/textualPointScene';
import type { CommentProperties } from './commentProperties';

const { drawCorner } = _Scene;

const DEFAULT_PADDING = {
    top: 8,
    right: 14,
    bottom: 8,
    left: 14,
};

export class CommentScene extends TextualPointScene<CommentProperties> {
    static override is(value: unknown): value is CommentScene {
        return AnnotationScene.isCheck(value, AnnotationType.Comment);
    }

    override type = AnnotationType.Comment;

    private readonly shape = new _Scene.Path();
    private padding = { ...DEFAULT_PADDING };

    constructor() {
        super();
        this.append([this.shape, this.label, this.handle]);
    }

    public override update(datum: CommentProperties, context: AnnotationContext): void {
        const { padding } = this;

        if (datum.padding == null) {
            padding.top = Math.max(datum.fontSize * 0.4, DEFAULT_PADDING.top);
            padding.bottom = Math.max(datum.fontSize * 0.4, DEFAULT_PADDING.bottom);
            padding.left = Math.max(datum.fontSize * 0.8, DEFAULT_PADDING.left);
            padding.right = Math.max(datum.fontSize * 0.8, DEFAULT_PADDING.right);
        } else {
            this.padding = {
                top: datum.padding,
                right: datum.padding,
                bottom: datum.padding,
                left: datum.padding,
            };
        }

        super.update(datum, context);
    }

    protected override updateShape(datum: CommentProperties, bbox: _Scene.BBox) {
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

    protected override getLabelCoords(_datum: CommentProperties, point: _Util.Vec2): _Util.Vec2 {
        const { padding } = this;

        return {
            x: point.x + padding.left,
            y: point.y - padding.bottom,
        };
    }

    protected override getHandleStyles(datum: CommentProperties) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke ?? datum.fill,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };
    }

    protected override updateAnchor(datum: CommentProperties, bbox: _Scene.BBox, context: AnnotationContext) {
        const anchor = super.updateAnchor(datum, bbox, context);
        anchor.y -= this.padding.bottom + this.padding.top;
        return anchor;
    }

    private updatePath(datum: CommentProperties, bbox: _Scene.BBox) {
        const { padding } = this;
        const { x, y } = bbox;
        let { width, height } = bbox;
        const { fontSize } = datum;

        const horizontalPadding = padding.left + padding.right;
        const verticalPadding = padding.top + padding.bottom;

        width = width + horizontalPadding;
        height = Math.max(height + verticalPadding, fontSize + verticalPadding);

        const top = y - height;
        const right = x + width;

        const cornerRadius = Math.min(20, Math.min(width, height) / 2);

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
