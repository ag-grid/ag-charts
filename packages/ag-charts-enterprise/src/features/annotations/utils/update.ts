import { AnnotationType } from '../annotationTypes';
import type { AnnotationContext } from '../annotationTypes';
import { annotationConfigs } from '../annotationsConfig';
import type { AnnotationDatum, AnnotationScene } from '../annotationsSuperTypes';

export function updateAnnotation(node: AnnotationScene, datum: AnnotationDatum, context: AnnotationContext) {
    annotationConfigs[datum.type].update(node, datum, context);
    node.updateSelectionAxes(hasSelectionAxes(datum) ? datum : undefined, context);
}

/** Horizontal and vertical lines have an axis label of their own, which they show all the time. */
function hasSelectionAxes({ type }: AnnotationDatum) {
    return type !== AnnotationType.HorizontalLine && type !== AnnotationType.VerticalLine;
}
