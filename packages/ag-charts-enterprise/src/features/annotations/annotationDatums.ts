import type { AnnotationDatumType } from './annotationDatum';
import type { AnnotationOptionsColorPickerType } from './annotationTypes';
import { AnnotationType } from './annotationTypes';
import type { AnnotationDatum } from './annotationsSuperTypes';
import { arrowDownDatum } from './arrow-down/arrowDownDatum';
import { arrowUpDatum } from './arrow-up/arrowUpDatum';
import { calloutDatum } from './callout/calloutDatum';
import { commentDatum } from './comment/commentDatum';
import { horizontalLineDatum, verticalLineDatum } from './cross-line/crossLineDatum';
import { disjointChannelDatum } from './disjoint-channel/disjointChannelDatum';
import { fibonacciRetracementTrendBasedDatum } from './fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedDatum';
import { fibonacciRetracementDatum } from './fibonacci-retracement/fibonacciRetracementDatum';
import { arrowDatum, lineDatum } from './line/lineDatum';
import {
    datePriceRangeDatum,
    dateRangeDatum,
    priceRangeDatum,
    quickDatePriceRangeDatum,
} from './measurer/measurerDatum';
import { noteDatum } from './note/noteDatum';
import { parallelChannelDatum } from './parallel-channel/parallelChannelDatum';
import { textDatum } from './text/textDatum';

export const annotationDatums: Record<AnnotationType, AnnotationDatumType<AnnotationDatum>> = {
    [AnnotationType.Line]: lineDatum,
    [AnnotationType.HorizontalLine]: horizontalLineDatum,
    [AnnotationType.VerticalLine]: verticalLineDatum,
    [AnnotationType.ParallelChannel]: parallelChannelDatum,
    [AnnotationType.DisjointChannel]: disjointChannelDatum,
    [AnnotationType.FibonacciRetracement]: fibonacciRetracementDatum,
    [AnnotationType.FibonacciRetracementTrendBased]: fibonacciRetracementTrendBasedDatum,
    [AnnotationType.Callout]: calloutDatum,
    [AnnotationType.Comment]: commentDatum,
    [AnnotationType.Note]: noteDatum,
    [AnnotationType.Text]: textDatum,
    [AnnotationType.Arrow]: arrowDatum,
    [AnnotationType.ArrowUp]: arrowUpDatum,
    [AnnotationType.ArrowDown]: arrowDownDatum,
    [AnnotationType.DateRange]: dateRangeDatum,
    [AnnotationType.PriceRange]: priceRangeDatum,
    [AnnotationType.DatePriceRange]: datePriceRangeDatum,
    [AnnotationType.QuickDatePriceRange]: quickDatePriceRangeDatum,
};

export function isHoverable(datum: AnnotationDatum) {
    return annotationDatums[datum.type].isHoverable?.(datum) ?? !datum.readOnly;
}

export function getDefaultColor(datum: AnnotationDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    return annotationDatums[datum.type].getDefaultColor(datum, colorPickerType);
}

export function getDefaultOpacity(datum: AnnotationDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    return annotationDatums[datum.type].getDefaultOpacity(datum, colorPickerType);
}
