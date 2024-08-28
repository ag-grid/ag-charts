import { type TextAlign, _ModuleSupport } from 'ag-charts-community';

import type { AnnotationInterface, LineInterface } from '../annotationProperties';
import type { AnnotationContext, Constructor } from '../annotationTypes';
import type { AnnotationTextAlignment, AnnotationTextPosition } from '../text/util';
import { convertPoint } from '../utils/values';

const { STRING, Validate } = _ModuleSupport;

export interface TextualStartEndInterface extends AnnotationInterface, LineInterface {
    position: AnnotationTextPosition;
    alignment: AnnotationTextAlignment;
    textAlign: TextAlign;
    width?: number;
}

export function TextualStartEnd<
    T extends Constructor<_ModuleSupport.BaseProperties & AnnotationInterface & LineInterface>,
>(Parent: T) {
    abstract class TextualStartEndInternal extends Parent {
        @Validate(STRING)
        text: string = '';

        position: AnnotationTextPosition = 'top';
        alignment: AnnotationTextAlignment = 'left';
        textAlign: TextAlign = 'left';
        width?: number;

        public getTextInputCoords(context: AnnotationContext): { x: number; y: number } {
            return convertPoint(this.end, context);
        }
    }
    return TextualStartEndInternal;
}
