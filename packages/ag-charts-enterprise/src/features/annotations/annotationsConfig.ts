import { AnnotationType } from './annotationTypes';
import type { AnnotationDatum, AnnotationScene, AnnotationTypeConfig } from './annotationsSuperTypes';
import { arrowDownConfig } from './arrow-down/arrowDownConfig';
import { arrowUpConfig } from './arrow-up/arrowUpConfig';
import { calloutConfig } from './callout/calloutConfig';
import { commentConfig } from './comment/commentConfig';
import { horizontalLineConfig, verticalLineConfig } from './cross-line/crossLineConfig';
import { disjointChannelConfig } from './disjoint-channel/disjointChannelConfig';
import { fibonacciRetracementTrendBasedConfig } from './fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedConfig';
import { fibonacciRetracementConfig } from './fibonacci-retracement/fibonacciRetracementConfig';
import { arrowConfig, lineConfig } from './line/lineConfig';
import {
    datePriceRangeConfig,
    dateRangeConfig,
    priceRangeConfig,
    quickDatePriceRangeConfig,
} from './measurer/measurerConfig';
import { noteConfig } from './note/noteConfig';
import { parallelChannelConfig } from './parallel-channel/parallelChannelConfig';
import { textConfig } from './text/textConfig';

export const annotationConfigs: Record<AnnotationType, AnnotationTypeConfig<AnnotationDatum, AnnotationScene>> = {
    // Lines
    [AnnotationType.Line]: lineConfig,
    [AnnotationType.HorizontalLine]: horizontalLineConfig,
    [AnnotationType.VerticalLine]: verticalLineConfig,

    // Channels
    [AnnotationType.ParallelChannel]: parallelChannelConfig,
    [AnnotationType.DisjointChannel]: disjointChannelConfig,

    // Fibonaccis
    [AnnotationType.FibonacciRetracement]: fibonacciRetracementConfig,
    [AnnotationType.FibonacciRetracementTrendBased]: fibonacciRetracementTrendBasedConfig,

    // Texts
    [AnnotationType.Callout]: calloutConfig,
    [AnnotationType.Comment]: commentConfig,
    [AnnotationType.Note]: noteConfig,
    [AnnotationType.Text]: textConfig,

    // Shapes
    [AnnotationType.Arrow]: arrowConfig,
    [AnnotationType.ArrowUp]: arrowUpConfig,
    [AnnotationType.ArrowDown]: arrowDownConfig,

    // Measurers
    [AnnotationType.DateRange]: dateRangeConfig,
    [AnnotationType.PriceRange]: priceRangeConfig,
    [AnnotationType.DatePriceRange]: datePriceRangeConfig,
    [AnnotationType.QuickDatePriceRange]: quickDatePriceRangeConfig,
};
