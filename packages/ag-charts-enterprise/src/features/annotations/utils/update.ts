import { AnnotationType } from '../annotationTypes';
import type { AnnotationContext } from '../annotationTypes';
import { annotationConfigs } from '../annotationsConfig';
import type { AnnotationDatum, AnnotationScene } from '../annotationsSuperTypes';

export function updateAnnotation(node: AnnotationScene, datum: AnnotationDatum, context: AnnotationContext) {
    annotationConfigs[datum.type].update(node, datum, context);
    node.updateSelectionAxes(hasSelectionAxes(datum) ? datum : undefined, context);
}

/**
 * The types that show axis labels and shading when selected. Horizontal and vertical lines have an axis label of their
 * own, which they show all the time. The single-point types are not here yet.
 */
const SELECTION_AXES_TYPES = new Set<AnnotationType>([
    AnnotationType.Line,
    AnnotationType.Arrow,
    AnnotationType.ParallelChannel,
    AnnotationType.DisjointChannel,
    AnnotationType.FibonacciRetracement,
    AnnotationType.FibonacciRetracementTrendBased,
    AnnotationType.DateRange,
    AnnotationType.PriceRange,
    AnnotationType.DatePriceRange,
    AnnotationType.QuickDatePriceRange,
]);

function hasSelectionAxes({ type }: AnnotationDatum) {
    return SELECTION_AXES_TYPES.has(type);
}
