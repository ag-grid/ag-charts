import { _ModuleSupport } from 'ag-charts-community';

import type {
    AnnotationProperties,
    ChannelPropertiesType,
    LinePropertiesType,
    TextualPropertiesType,
} from '../annotationsSuperTypes';
import { ArrowDownProperties } from '../arrow-down/arrowDownProperties';
import { ArrowUpProperties } from '../arrow-up/arrowUpProperties';
import { CalloutProperties } from '../callout/calloutProperties';
import { CommentProperties } from '../comment/commentProperties';
import { NoteProperties } from '../note/noteProperties';
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
        ArrowUpProperties.is(datum) ||
        ArrowDownProperties.is(datum)
    );
}

export function hasTextColor(datum?: AnnotationProperties) {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function hasLineText(datum?: AnnotationProperties): datum is LinePropertiesType | ChannelPropertiesType {
    return (isLineType(datum) || isChannelType(datum)) && isObject(datum.text);
}
