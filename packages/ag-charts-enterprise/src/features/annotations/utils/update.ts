import type { AnnotationContext } from '../annotationTypes';
import { annotationConfigs } from '../annotationsConfig';
import type { AnnotationProperties, AnnotationScene, AnnotationTypeConfig } from '../annotationsSuperTypes';

export function updateAnnotation(node: AnnotationScene, datum: AnnotationProperties, context: AnnotationContext) {
    for (const value of Object.values(annotationConfigs)) {
        const lenientValue: AnnotationTypeConfig<any, AnnotationScene> = value;
        lenientValue.update(node, datum, context);
    }
}
