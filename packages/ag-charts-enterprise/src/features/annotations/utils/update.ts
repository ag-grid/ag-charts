import { hasSelectionAxes } from '../annotationDatum';
import type { AnnotationContext } from '../annotationTypes';
import { annotationConfigs } from '../annotationsConfig';
import type { AnnotationDatum, AnnotationScene } from '../annotationsSuperTypes';

export function updateAnnotation(node: AnnotationScene, datum: AnnotationDatum, context: AnnotationContext) {
    annotationConfigs[datum.type].update(node, datum, context);
    node.updateSelectionAxes(hasSelectionAxes(datum) ? datum : undefined, context);
}
