import type {
    ChannelDatumType,
    EphemeralDatumType,
    FibonacciDatumType,
    LineDatumType,
    MeasurerDatumType,
    ShapeDatumType,
    TextualDatumType,
} from '../annotationsSuperTypes';
import { arrowDownDatum } from '../arrow-down/arrowDownDatum';
import { arrowUpDatum } from '../arrow-up/arrowUpDatum';
import { calloutDatum } from '../callout/calloutDatum';
import { commentDatum } from '../comment/commentDatum';
import { type CrossLineDatum, horizontalLineDatum, verticalLineDatum } from '../cross-line/crossLineDatum';
import { disjointChannelDatum } from '../disjoint-channel/disjointChannelDatum';
import { fibonacciRetracementTrendBasedDatum } from '../fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedDatum';
import { fibonacciRetracementDatum } from '../fibonacci-retracement/fibonacciRetracementDatum';
import { arrowDatum, lineDatum } from '../line/lineDatum';
import {
    datePriceRangeDatum,
    dateRangeDatum,
    priceRangeDatum,
    quickDatePriceRangeDatum,
} from '../measurer/measurerDatum';
import { noteDatum } from '../note/noteDatum';
import { parallelChannelDatum } from '../parallel-channel/parallelChannelDatum';
import { textDatum } from '../text/textDatum';

export function isEphemeralType(datum: unknown): datum is EphemeralDatumType {
    return quickDatePriceRangeDatum.is(datum);
}

export function isLineType(datum: unknown): datum is LineDatumType {
    return (
        lineDatum.is(datum) ||
        horizontalLineDatum.is(datum) ||
        verticalLineDatum.is(datum) ||
        arrowDatum.is(datum) ||
        isFibonacciType(datum)
    );
}

export function isCrossLineType(datum: unknown): datum is CrossLineDatum {
    return horizontalLineDatum.is(datum) || verticalLineDatum.is(datum);
}

export function isChannelType(datum: unknown): datum is ChannelDatumType {
    return disjointChannelDatum.is(datum) || parallelChannelDatum.is(datum);
}

export function isFibonacciType(datum: unknown): datum is FibonacciDatumType {
    return fibonacciRetracementDatum.is(datum) || fibonacciRetracementTrendBasedDatum.is(datum);
}

export function isTextType(datum: unknown): datum is TextualDatumType {
    return calloutDatum.is(datum) || commentDatum.is(datum) || noteDatum.is(datum) || textDatum.is(datum);
}

export function isShapeType(datum: unknown): datum is ShapeDatumType {
    return arrowUpDatum.is(datum) || arrowDownDatum.is(datum);
}

export function isMeasurerType(datum: unknown): datum is MeasurerDatumType {
    return (
        dateRangeDatum.is(datum) ||
        priceRangeDatum.is(datum) ||
        datePriceRangeDatum.is(datum) ||
        quickDatePriceRangeDatum.is(datum)
    );
}
