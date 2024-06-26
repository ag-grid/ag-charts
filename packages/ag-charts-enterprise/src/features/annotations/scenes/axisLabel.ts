import { type Formatter, _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AnnotationAxisLabelProperties } from '../annotationProperties';
import type { AnnotationAxisContext } from '../annotationTypes';

const { calculateLabelTranslation, ChartAxisDirection } = _ModuleSupport;

type UpdateOpts = {
    x: number;
    y: number;
    value: any;
    styles: Partial<AnnotationAxisLabelProperties>;
    context: AnnotationAxisContext;
};

export class AxisLabel extends _Scene.Group {
    static override readonly className = 'AxisLabel';

    private readonly label = new _Scene.Text({ zIndex: 1 });
    private readonly rect = new _Scene.Rect();

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
        const { label } = this;

        const { fontWeight, fontSize, fontStyle, fontFamily, textAlign, color = 'white', formatter } = styles;
        label.setProperties({ fontWeight, fontSize, fontStyle, fontFamily, textAlign, fill: color });
        label.text = this.getFormattedValue(value, formatter ?? context.scaleValueFormatter());
    }

    private updateRect({ styles }: UpdateOpts) {
        const { rect } = this;

        const { cornerRadius, fill, fillOpacity, stroke, strokeOpacity } = styles;

        rect.setProperties({ cornerRadius, fill, fillOpacity, stroke, strokeOpacity });
    }

    private updatePosition({ x, y, context, styles: { padding } }: UpdateOpts) {
        const { label, rect } = this;

        const labelBBox = label.computeBBox();

        const horizontalPadding = 8;
        const verticalPadding = 5;
        labelBBox.grow(padding ?? horizontalPadding, 'horizontal');
        labelBBox.grow(padding ?? verticalPadding, 'vertical');

        const shift = context.direction === ChartAxisDirection.X ? verticalPadding / 2 : horizontalPadding;

        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection: true,
            padding: context.labelPadding - shift,
            position: context.position ?? 'left',
            bbox: labelBBox,
        });

        const translationX = x + xTranslation;
        const translationY = y + yTranslation;

        label.translationX = translationX;
        label.translationY = translationY;

        rect.x = translationX - labelBBox.width / 2;
        rect.y = translationY - labelBBox.height / 2;
        rect.height = labelBBox.height;
        rect.width = labelBBox.width;
    }

    private getFormattedValue(value: any, formatter?: Formatter<any>) {
        return formatter?.(value) ?? String(value);
    }
}
