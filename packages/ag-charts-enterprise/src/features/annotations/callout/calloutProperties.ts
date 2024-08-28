import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Fill, Font, Handle, Label, Line, Stroke } from '../annotationProperties';
import { type AnnotationContext, AnnotationType, type Padding } from '../annotationTypes';
import { DefaultColorFillLineText, PlaceholderText } from '../properties/mixins';
import { TextualStartEnd } from '../properties/textualStartEndProperties';

const { STRING, BaseProperties, Validate, isObject } = _ModuleSupport;

const DEFAULT_CALLOUT_PADDING = {
    top: 6,
    right: 12,
    bottom: 9,
    left: 12,
};

export class CalloutProperties extends DefaultColorFillLineText(
    PlaceholderText(TextualStartEnd(Annotation(Fill(Stroke(Line(Handle(Label(Font(BaseProperties)))))))))
) {
    static is(value: unknown): value is CalloutProperties {
        return isObject(value) && value.type === AnnotationType.Callout;
    }

    @Validate(STRING)
    type = AnnotationType.Callout as const;

    override position = 'bottom' as const;
    override alignment = 'left' as const;

    getPadding(): Padding {
        const { padding } = this;
        if (padding == null) {
            return { ...DEFAULT_CALLOUT_PADDING };
        }

        return {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding,
        };
    }

    getText() {
        const isPlaceholder = this.text.length == 0;
        const text = !isPlaceholder ? this.text : this.placeholderText ?? '';
        return {
            text,
            isPlaceholder,
        };
    }

    override getTextInputCoords(context: AnnotationContext) {
        const coords = super.getTextInputCoords(context);
        const padding = this.getPadding();

        const paddingLeft = typeof padding === 'number' ? padding : padding?.left ?? 0;
        const paddingBottom = typeof padding === 'number' ? padding : padding?.bottom ?? 0;

        return {
            x: coords.x + paddingLeft,
            y: coords.y - paddingBottom,
        };
    }
}
