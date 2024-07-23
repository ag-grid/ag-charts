import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { Point } from '../annotationProperties';
import type { AnnotationContext } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';
import { TextualPropertiesBase } from './textualPropertiesBase';

export class TextualProperties extends Point(TextualPropertiesBase) {
    public override getTextBBox(context: AnnotationContext) {
        const coords = convertPoint(this, context);
        return new _Scene.BBox(coords.x, coords.y, 0, 0);
    }
}
