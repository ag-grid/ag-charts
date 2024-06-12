import { type Formatter, _ModuleSupport, _Scene } from 'ag-charts-community';

import { calculateAxisLabelPosition } from '../../../utils/position';
import type { AnnotationAxisLabelProperties } from '../annotationProperties';
import type { AnnotationAxisContext } from '../annotationTypes';

const { calculateLabelTranslation } = _ModuleSupport;

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

    updateLabel({ value, styles, context }: UpdateOpts) {
        const { label } = this;

        const { fontWeight, fontSize, fontStyle, fontFamily, textAlign, color = 'white', formatter } = styles;
        label.setProperties({ fontWeight, fontSize, fontStyle, fontFamily, textAlign, fill: color });
        label.text = this.getFormattedValue(value, formatter ?? context.scaleValueFormatter());
    }

    updateRect({ styles }: UpdateOpts) {
        const { rect } = this;

        const { cornerRadius, fill, fillOpacity, stroke, strokeOpacity } = styles;

        rect.setProperties({ cornerRadius, fill, fillOpacity, stroke, strokeOpacity });
    }

    private updatePosition({ x, y, context, styles: { padding = 0 } }: UpdateOpts) {
        const { label, rect } = this;

        const labelBBox = label.computeBBox();
        labelBBox.grow(padding / 2);

        const axisPosition = context.position ?? 'left';

        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection: true,
            padding: context.labelPadding,
            position: axisPosition,
            bbox: labelBBox,
        });

        label.translationX = x + xTranslation;
        label.translationY = y + yTranslation;

        const labelContainer = calculateAxisLabelPosition({
            x,
            y,
            labelBBox,
            bounds: context.bounds,
            axisPosition: axisPosition,
            axisDirection: context.direction,
            padding: context.labelPadding,
        });

        rect.x = labelContainer.x;
        rect.y = labelContainer.y;
        rect.height = labelBBox.height;
        rect.width = labelBBox.width;
    }

    getFormattedValue(value: any, formatter?: Formatter<any>) {
        return formatter?.(value) ?? String(value);
    }
}
