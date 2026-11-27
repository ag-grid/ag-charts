import type { AnnotationContext } from '../annotationTypes';
import { annotationConfigs } from '../annotationsConfig';
import type { AnnotationDatum, AnnotationScene } from '../annotationsSuperTypes';
import { isCrossLineType } from './types';

export function updateAnnotation(node: AnnotationScene, datum: AnnotationDatum, context: AnnotationContext) {
    annotationConfigs[datum.type].update(node, datum, context);
    node.updateSelectionAxes(isCrossLineType(datum) ? undefined : datum, context);
}
