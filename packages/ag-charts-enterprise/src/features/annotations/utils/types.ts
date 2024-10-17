import type {
    ChannelPropertiesType,
    EphemeralPropertiesType,
    LinePropertiesType,
    MeasurerPropertiesType,
    TextualPropertiesType,
} from '../annotationsSuperTypes';
import { CalloutProperties } from '../callout/calloutProperties';
import { CommentProperties } from '../comment/commentProperties';
import { HorizontalLineProperties, VerticalLineProperties } from '../cross-line/crossLineProperties';
import { DisjointChannelProperties } from '../disjoint-channel/disjointChannelProperties';
import { ArrowProperties, LineProperties } from '../line/lineProperties';
import {
    DatePriceRangeProperties,
    DateRangeProperties,
    PriceRangeProperties,
    QuickDatePriceRangeProperties,
} from '../measurer/measurerProperties';
import { NoteProperties } from '../note/noteProperties';
import { ParallelChannelProperties } from '../parallel-channel/parallelChannelProperties';
import { TextProperties } from '../text/textProperties';

export function isEphemeralType(datum: unknown): datum is EphemeralPropertiesType {
    return QuickDatePriceRangeProperties.is(datum);
}

export function isLineType(datum: unknown): datum is LinePropertiesType {
    return (
        LineProperties.is(datum) ||
        HorizontalLineProperties.is(datum) ||
        VerticalLineProperties.is(datum) ||
        ArrowProperties.is(datum)
    );
}

export function isChannelType(datum: unknown): datum is ChannelPropertiesType {
    return DisjointChannelProperties.is(datum) || ParallelChannelProperties.is(datum);
}

export function isTextType(datum: unknown): datum is TextualPropertiesType {
    return (
        CalloutProperties.is(datum) ||
        CommentProperties.is(datum) ||
        NoteProperties.is(datum) ||
        TextProperties.is(datum)
    );
}

export function isMeasurerType(datum: unknown): datum is MeasurerPropertiesType {
    return (
        DateRangeProperties.is(datum) ||
        PriceRangeProperties.is(datum) ||
        DatePriceRangeProperties.is(datum) ||
        QuickDatePriceRangeProperties.is(datum)
    );
}
