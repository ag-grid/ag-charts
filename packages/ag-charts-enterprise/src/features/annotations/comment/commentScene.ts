import { _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualPointScene } from '../scenes/textualPointScene';
import type { CommentProperties } from './commentProperties';

const { drawCorner } = _Scene;

const DEFAULT_PADDING = 10;

export class CommentScene extends TextualPointScene<CommentProperties> {
    static override is(value: unknown): value is CommentScene {
        return AnnotationScene.isCheck(value, AnnotationType.Comment);
    }

    override type = AnnotationType.Comment;

    private readonly shape = new _Scene.Path();

    constructor() {
        super();
        this.append([this.shape, this.label, this.handle]);
    }

    override update(datum: CommentProperties, context: AnnotationContext) {
        super.update(datum, context);
    }

    protected override updateShape(datum: CommentProperties, bbox: _Scene.BBox) {
        const { shape } = this;

        // update shape styles
        shape.fill = datum.fill;
        shape.fillOpacity = datum.fillOpacity ?? 1;
        shape.stroke = datum.stroke;
        shape.strokeWidth = datum.strokeWidth ?? 1;
        shape.strokeOpacity = datum.strokeOpacity ?? 1;

        // update shape path
        this.updatePath(bbox, datum);
    }

    protected override getLabelCoords(datum: CommentProperties, point: _Util.Vec2): _Util.Vec2 {
        const padding = datum.padding ?? DEFAULT_PADDING;

        return {
            x: point.x + padding,
            y: point.y - padding,
        };
    }

    override getAnchor() {
        const bbox = this.getCachedBBoxWithoutHandles();

        return {
            x: bbox.x,
            y: bbox.y + bbox.height,
            position: 'above-left' as const,
        };
    }

    private updatePath(bbox: _Scene.BBox, datum: CommentProperties) {
        const labelBBox = this.label.computeBBox();

        let { width, height } = labelBBox;

        const { padding = DEFAULT_PADDING, fontSize } = datum;
        const doublePadding = padding * 2;

        const isEditState = !datum.visible;

        // Add the extra character width to the shape as html text input is updated before canvas text is updated/ visible
        width = Math.max(width + doublePadding + (isEditState ? fontSize : 0), fontSize + doublePadding);
        height = Math.max(height + doublePadding, fontSize + doublePadding);

        // anchor at bottom left
        const x = bbox.x;
        const y = bbox.y;

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
}
