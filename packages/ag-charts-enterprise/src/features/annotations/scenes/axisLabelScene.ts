import { _ModuleSupport } from 'ag-charts-community';
import type { Padding, PaddingOptions } from 'ag-charts-types';

import type { AxisLabelProperties } from '../annotationProperties';
import type { AnnotationAxisContext } from '../annotationTypes';

const { calculateLabelTranslation } = _ModuleSupport;

const DEFAULT_AXIS_LABEL_PADDING = { top: 4, right: 8, bottom: 4, left: 8 };

function normaliseAxisLabelPadding(padding: Padding | undefined): Required<PaddingOptions> {
    if (padding == null) return DEFAULT_AXIS_LABEL_PADDING;
    if (typeof padding === 'number') {
        return { top: padding, right: padding, bottom: padding, left: padding };
    }
    return {
        top: padding.top ?? DEFAULT_AXIS_LABEL_PADDING.top,
        right: padding.right ?? DEFAULT_AXIS_LABEL_PADDING.right,
        bottom: padding.bottom ?? DEFAULT_AXIS_LABEL_PADDING.bottom,
        left: padding.left ?? DEFAULT_AXIS_LABEL_PADDING.left,
    };
}

type UpdateOpts = {
    x: number;
    y: number;
    value: any;
    styles: Partial<AxisLabelProperties>;
    context: AnnotationAxisContext;
};

export class AxisLabelScene extends _ModuleSupport.Group {
    static override readonly className = 'AxisLabel';

    private readonly label = new _ModuleSupport.Text({ zIndex: 1 });
    private readonly rect = new _ModuleSupport.Rect();

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

    private updateLabel({ value, styles, context }: UpdateOpts) {
        const { fontWeight, fontSize, fontStyle, fontFamily, textAlign, color = 'white', formatter } = styles;
        const text = formatter ? formatter({ value }) : context.formatScaleValue(value, 'annotation-label');

        this.label.setProperties({
            fontWeight,
            fontSize,
            fontStyle,
            fontFamily,
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

    private updatePosition({ x, y, context, styles: { padding } }: UpdateOpts) {
        const { label, rect } = this;

        const labelBBox = label.getBBox()?.clone();
        const { top, right, bottom, left } = normaliseAxisLabelPadding(padding);

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

        // The rect is placed from the text anchor, so asymmetric padding is not averaged away. Rounding
        // the half-width before subtracting keeps the default output identical to the previous
        // `Math.round((width + left + right) / 2)` form.
        rect.x = translationX - Math.round(labelBBox.width / 2) - left;
        rect.y = translationY - Math.round(labelBBox.height / 2) - top;
        rect.width = labelBBox.width + left + right;
        rect.height = labelBBox.height + top + bottom;
    }
}
