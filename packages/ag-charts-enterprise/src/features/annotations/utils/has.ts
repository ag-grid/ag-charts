import { _ModuleSupport } from 'ag-charts-community';

import type {
    AnnotationProperties,
    ChannelPropertiesType,
    EphemeralPropertiesType,
    LinePropertiesType,
    MeasurerPropertiesType,
    TextualPropertiesType,
} from '../annotationsSuperTypes';
import { CalloutProperties } from '../callout/calloutProperties';
import { CommentProperties } from '../comment/commentProperties';
import { QuickDatePriceRangeProperties } from '../measurer/measurerProperties';
import { NoteProperties } from '../note/noteProperties';
import { ShapePointProperties } from '../properties/shapePointProperties';
import { isChannelType, isEphemeralType, isLineType, isMeasurerType, isTextType } from './types';

const { isObject } = _ModuleSupport;

export function hasFontSize(datum?: AnnotationProperties): datum is Exclude<TextualPropertiesType, NoteProperties> {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function hasLineStyle(
    datum?: AnnotationProperties
): datum is Exclude<LinePropertiesType | ChannelPropertiesType | MeasurerPropertiesType, EphemeralPropertiesType> {
    return (
        isLineType(datum) || isChannelType(datum) || (isMeasurerType(datum) && !QuickDatePriceRangeProperties.is(datum))
    );
}

export function hasLineColor(datum?: AnnotationProperties) {
    return (
        isLineType(datum) ||
        isChannelType(datum) ||
        isMeasurerType(datum) ||
        CalloutProperties.is(datum) ||
        NoteProperties.is(datum)
    );
}

export function hasIconColor(datum?: AnnotationProperties) {
    return NoteProperties.is(datum);
}

export function hasFillColor(datum?: AnnotationProperties) {
    return (
        isChannelType(datum) ||
        isMeasurerType(datum) ||
        CalloutProperties.is(datum) ||
        CommentProperties.is(datum) ||
        ShapePointProperties.is(datum)
    );
}

export function hasTextColor(datum?: AnnotationProperties) {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function hasLineText(
    datum?: AnnotationProperties
): datum is Exclude<LinePropertiesType | ChannelPropertiesType | MeasurerPropertiesType, EphemeralPropertiesType> {
    return (
        (isLineType(datum) || isChannelType(datum) || isMeasurerType(datum)) &&
        !isEphemeralType(datum) &&
        isObject(datum.text)
    );
}
