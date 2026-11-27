import { Group, Rect, Text, calculateLabelTranslation } from 'ag-charts-core';
import type { Padding, PaddingOptions } from 'ag-charts-types';

import type { AxisLabelDatum } from '../annotationDatum';
import type { AnnotationAxisContext } from '../annotationTypes';

// Defaults preserve the spacing the container had before `padding` was configurable.
function normaliseAxisLabelPadding(padding: Padding | undefined): Required<PaddingOptions> {
    if (typeof padding === 'number') {
        return { top: padding, right: padding, bottom: padding, left: padding };
    }
    const { top = 4, right = 8, bottom = 4, left = 8 } = padding ?? {};
    return { top, right, bottom, left };
}

type UpdateOpts = {
    x: number;
    y: number;
    value: any;
    styles: AxisLabelDatum;
    context: AnnotationAxisContext;
    /** Keeps the container as wide as it has been, rather than resizing it to fit each text. */
    holdWidth?: boolean;
};

export class AxisLabelScene extends Group {
    static override readonly className = 'AxisLabel';

    private readonly label = new Text({ zIndex: 1 });
    private readonly rect = new Rect();
    private width = 0;

    constructor() {
        super({ name: 'AnnotationAxisLabelGroup' });

        const { label } = this;
        label.fontSize = 12;
        label.fontFamily =
            '"IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
        label.fill = 'black';
        label.textBaseline = 'middle';
        label.textAlign = 'center';

        this.append([this.rect, this.label]);
    }

    update(opts: UpdateOpts) {
        this.updateLabel(opts);
        this.updateRect(opts);
        this.updatePosition(opts);
    }

    resetWidth() {
        this.width = 0;
    }

    /** How far the label's container reaches from the axis edge it was placed against, across the axis. */
    getReach(isX: boolean, outward: 1 | -1, origin: number) {
        const { rect } = this;
        const [near, size] = isX ? [rect.y, rect.height] : [rect.x, rect.width];
        return outward > 0 ? near + size - origin : origin - near;
    }

    private updateLabel({ value, styles, context }: UpdateOpts) {
        const {
            fontWeight,
            fontSize,
            fontStyle,
            fontFamily,
            lineHeight,
            textAlign,
            color = 'white',
            formatter,
        } = styles;
        const text = formatter ? formatter({ value }) : context.formatScaleValue(value, 'annotation-label');

        this.label.setProperties({
            fontWeight,
            fontSize,
            fontStyle,
            fontFamily,
            lineHeight,
            textAlign,
            fill: color,
            text,
        });
    }

    private updateRect({ styles }: UpdateOpts) {
        const { rect } = this;

        const { cornerRadius, fill, fillOpacity, stroke, strokeOpacity } = styles;

        rect.fill = fill;
        rect.fillOpacity = fillOpacity ?? 1;
        rect.stroke = stroke;
        rect.strokeOpacity = strokeOpacity ?? 1;
        rect.cornerRadius = cornerRadius ?? 0;
    }

    private updatePosition({ x, y, context, holdWidth, styles: { padding } }: UpdateOpts) {
        const { label, rect } = this;

        const labelBBox = label.getBBox()?.clone();
        const { top, right, bottom, left } = normaliseAxisLabelPadding(padding);

        // Text of a different width would otherwise resize the container as a handle is dragged, which flickers.
        if (holdWidth) {
            this.width = Math.max(this.width, labelBBox.width + left + right);
            labelBBox.width = this.width - left - right;
        }

        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection: true,
            padding: context.labelPadding,
            position: context.position ?? 'left',
            bbox: labelBBox,
        });

        const translationX = x + xTranslation;
        const translationY = y + yTranslation;

        label.x = translationX;
        label.y = translationY;

        // The rect is placed from the text anchor, so asymmetric padding is not averaged away.
        rect.x = translationX - Math.round(labelBBox.width / 2) - left;
        rect.y = translationY - Math.round(labelBBox.height / 2) - top;
        rect.width = labelBBox.width + left + right;
        rect.height = labelBBox.height + top + bottom;
    }
}
