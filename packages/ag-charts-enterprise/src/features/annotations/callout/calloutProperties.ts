import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Line } from '../annotationProperties';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { convertLine } from '../annotationUtils';
import { TextualPropertiesBase } from '../properties/textualPropertiesBase';

const { STRING, Validate, isObject } = _ModuleSupport;
const { BBox } = _Scene;

export interface CalloutDimensions {
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

export class CalloutProperties extends Line(TextualPropertiesBase) {
    static is(value: unknown): value is CalloutProperties {
        return isObject(value) && value.type === AnnotationType.Callout;
    }

    textBBox: _Scene.BBox = new BBox(0, 0, 0, 0);

    @Validate(STRING)
    type = AnnotationType.Callout as const;

    override position = 'top' as const;
    override alignment = 'left' as const;

    public override getTextBBox(context: AnnotationContext) {
        const dimensions = this.getDimensions(this.textBBox, context);
        if (!dimensions) {
            const coords = convertLine(this, context);
            return new BBox(coords?.x1 ?? 0, coords?.y1 ?? 0, 0, 0);
        }
        const { x, y, width, height } = dimensions.bodyBounds;
        const halfFontSize = this.fontSize / 2;
        const halfPadding = this.padding ?? 20 / 2;

        return new BBox(x + halfPadding, y - height + halfFontSize, height, width);
    }

    public getDimensions(textBBox: _Scene.BBox, context: AnnotationContext): CalloutDimensions | undefined {
        const { padding = 20, fontSize } = this;

        const coords = convertLine(this, context);

        if (!coords) {
            return;
        }

        let { width, height } = textBBox;

        width = Math.max(55, width);
        height = Math.max(15, height);

        // Add the extra character width to the shape as html text input is updated before canvas text is updated/ visible
        width = Math.max(width + padding + fontSize, fontSize + padding);
        height = Math.max(height + padding, fontSize + padding);

        return {
            tailPoint: {
                x: coords.x1,
                y: coords.y1,
            },
            bodyBounds: {
                x: coords.x2 - width / 2,
                y: coords.y2 + height / 2,
                width,
                height,
            },
        };
    }
}
