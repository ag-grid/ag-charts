import type {
    AnnotationDatum,
    ChannelDatumType,
    EphemeralDatumType,
    LineDatumType,
    MeasurerDatumType,
    ShapeDatumType,
    TextualDatumType,
} from '../annotationsSuperTypes';
import { type CalloutDatum, calloutDatum } from '../callout/calloutDatum';
import { type CommentDatum, commentDatum } from '../comment/commentDatum';
import type { CrossLineDatum } from '../cross-line/crossLineDatum';
import { quickDatePriceRangeDatum } from '../measurer/measurerDatum';
import { type NoteDatum, noteDatum } from '../note/noteDatum';
import { type TextDatum, textDatum } from '../text/textDatum';
import { isChannelType, isCrossLineType, isLineType, isMeasurerType, isShapeType, isTextType } from './types';

type StyledLineDatumType = Exclude<LineDatumType | ChannelDatumType | MeasurerDatumType, EphemeralDatumType>;

export function hasFontSize(datum?: AnnotationDatum): datum is Exclude<TextualDatumType, NoteDatum> {
    return isTextType(datum) && !noteDatum.is(datum);
}

export function hasLineStyle(datum?: AnnotationDatum): datum is StyledLineDatumType {
    return isLineType(datum) || isChannelType(datum) || (isMeasurerType(datum) && !quickDatePriceRangeDatum.is(datum));
}

export function hasLineColor(datum?: AnnotationDatum) {
    return (
        isLineType(datum) ||
        isChannelType(datum) ||
        isMeasurerType(datum) ||
        calloutDatum.is(datum) ||
        noteDatum.is(datum)
    );
}

export function hasIconColor(datum?: AnnotationDatum) {
    return noteDatum.is(datum);
}

export function hasFillColor(datum?: AnnotationDatum) {
    return (
        isChannelType(datum) ||
        isMeasurerType(datum) ||
        calloutDatum.is(datum) ||
        commentDatum.is(datum) ||
        isShapeType(datum)
    );
}

export function hasFillField(
    datum: AnnotationDatum
): datum is ShapeDatumType | CommentDatum | CalloutDatum | NoteDatum {
    return isShapeType(datum) || commentDatum.is(datum) || calloutDatum.is(datum) || noteDatum.is(datum);
}

export function hasBackground(datum: AnnotationDatum): datum is ChannelDatumType | MeasurerDatumType {
    return isChannelType(datum) || isMeasurerType(datum);
}

export function hasStroke(datum: AnnotationDatum): datum is Exclude<AnnotationDatum, ShapeDatumType | TextDatum> {
    return !isShapeType(datum) && !textDatum.is(datum);
}

export function hasExtendable(
    datum: AnnotationDatum
): datum is Exclude<LineDatumType, CrossLineDatum> | ChannelDatumType {
    return (isLineType(datum) && !isCrossLineType(datum)) || isChannelType(datum);
}

export function hasTextColor(datum?: AnnotationDatum) {
    return isTextType(datum) && !noteDatum.is(datum);
}

export function hasLineText(datum?: AnnotationDatum): datum is StyledLineDatumType {
    return hasLineStyle(datum);
}
