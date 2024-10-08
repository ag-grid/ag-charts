import { _ModuleSupport } from 'ag-charts-community';

import type {
    AnnotationProperties,
    ChannelPropertiesType,
    LinePropertiesType,
    MeasurerPropertiesType,
    TextualPropertiesType,
} from '../annotationsSuperTypes';
import { CalloutProperties } from '../callout/calloutProperties';
import { CommentProperties } from '../comment/commentProperties';
import { NoteProperties } from '../note/noteProperties';
import { ShapePointProperties } from '../properties/shapePointProperties';
import { isChannelType, isLineType, isMeasurerType, isTextType } from './types';

const { isObject } = _ModuleSupport;

export function hasFontSize(datum?: AnnotationProperties): datum is Exclude<TextualPropertiesType, NoteProperties> {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function hasLineStyle(
    datum?: AnnotationProperties
): datum is LinePropertiesType | ChannelPropertiesType | MeasurerPropertiesType {
    return isLineType(datum) || isChannelType(datum) || isMeasurerType(datum);
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

export function hasLineText(datum?: AnnotationProperties): datum is LinePropertiesType | ChannelPropertiesType {
    return (isLineType(datum) || isChannelType(datum) || isMeasurerType(datum)) && isObject(datum.text);
}
