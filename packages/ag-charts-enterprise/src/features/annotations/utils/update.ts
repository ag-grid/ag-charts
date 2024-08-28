import type { AnnotationContext } from '../annotationTypes';
import { annotationConfigs } from '../annotationsConfig';
import type { AnnotationProperties, AnnotationScene } from '../annotationsSuperTypes';

export function updateAnnotation(node: AnnotationScene, datum: AnnotationProperties, context: AnnotationContext) {
    for (const { update } of Object.values(annotationConfigs)) {
        update(node, datum, context);
    }
}
