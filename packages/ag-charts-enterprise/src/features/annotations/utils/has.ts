import { _ModuleSupport } from 'ag-charts-community';

import type {
    AnnotationProperties,
    ChannelPropertiesType,
    LinePropertiesType,
    TextualPropertiesType,
} from '../annotationsSuperTypes';
import { CalloutProperties } from '../callout/calloutProperties';
import { CommentProperties } from '../comment/commentProperties';
import { NoteProperties } from '../note/noteProperties';
import { ShapePointProperties } from '../properties/shapePointProperties';
import { isChannelType, isLineType, isTextType } from './types';

const { isObject } = _ModuleSupport;

export function hasFontSize(datum?: AnnotationProperties): datum is TextualPropertiesType {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function hasLineStyle(datum?: AnnotationProperties): datum is LinePropertiesType | ChannelPropertiesType {
    return isLineType(datum) || isChannelType(datum);
}

export function hasLineColor(datum?: AnnotationProperties) {
    return isLineType(datum) || isChannelType(datum) || CalloutProperties.is(datum) || NoteProperties.is(datum);
}

export function hasFillColor(datum?: AnnotationProperties) {
    return (
        isChannelType(datum) ||
        CalloutProperties.is(datum) ||
        CommentProperties.is(datum) ||
        ShapePointProperties.is(datum)
    );
}

export function hasTextColor(datum?: AnnotationProperties) {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function hasLineText(datum?: AnnotationProperties): datum is LinePropertiesType | ChannelPropertiesType {
    return (isLineType(datum) || isChannelType(datum)) && isObject(datum.text);
}
