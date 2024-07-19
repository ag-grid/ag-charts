import { _Scene, _Util } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualScene } from '../scenes/textualScene';
import type { CommentProperties } from './commentProperties';

const { drawCorner } = _Scene;

export class CommentScene extends TextualScene<CommentProperties> {
    static override is(value: unknown): value is CommentScene {
        return AnnotationScene.isCheck(value, AnnotationType.Comment);
    }

    override type = AnnotationType.Comment;

    private readonly shape = new _Scene.Path();

    constructor() {
        super();
        this.append([this.shape, this.label, this.handle]);
    }

    protected override updateHandle(datum: CommentProperties, textBBox: _Scene.BBox) {
        const styles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };

        const halfPadding = (datum.padding ?? 20) / 2;
        this.handle.update({
            ...styles,
            x: textBBox.x - halfPadding,
            y: textBBox.y + halfPadding,
        });
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

    private updatePath(bbox: _Scene.BBox, datum: CommentProperties) {
        const labelBBox = this.label.computeBBox();

        let { width, height } = labelBBox;

        const { padding = 20, fontSize } = datum;
        const halfPadding = padding / 2;

        const isEditState = !datum.visible;

        // Add the extra character width to the shape as html text input is updated before canvas text is updated/ visible
        width = Math.max(width + padding + (isEditState ? fontSize : 0), fontSize + padding);
        height = Math.max(height + padding, fontSize + padding);

        // anchor at bottom left
        const x = bbox.x - halfPadding;
        const y = bbox.y + halfPadding;

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
