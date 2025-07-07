import { _ModuleSupport } from 'ag-charts-community';

import type { AxisLabelProperties } from '../annotationProperties';
import type { AnnotationAxisContext } from '../annotationTypes';

const { calculateLabelTranslation } = _ModuleSupport;

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
        label.fontFamily = 'Verdana, sans-serif';
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

        const horizontalPadding = padding ?? 8;
        const verticalPadding = padding ?? 4;

        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection: true,
            padding: context.labelPadding,
            position: context.position ?? 'left',
            bbox: labelBBox,
        });

        labelBBox.grow(horizontalPadding, 'horizontal');
        labelBBox.grow(verticalPadding, 'vertical');

        const translationX = x + xTranslation;
        const translationY = y + yTranslation;

        label.x = translationX;
        label.y = translationY;

        rect.y = translationY - Math.round(labelBBox.height / 2);
        rect.x = translationX - Math.round(labelBBox.width / 2);
        rect.height = labelBBox.height;
        rect.width = labelBBox.width;
    }
}
