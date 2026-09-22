import { isObject } from 'ag-charts-core';

import {
    type AnnotationDatumBase,
    type AnnotationDatumType,
    type AxisLabelDatum,
    type HandleDatum,
    type LineStyleFields,
    type LineTextDatum,
    type StrokeFields,
    createAnnotationDatumBase,
    createAxisLabelDatum,
    createHandleDatum,
    createLineTextDatum,
} from '../annotationDatum';
import { AnnotationType, type DataPoint } from '../annotationTypes';

export interface CrossLineTypeDatum extends AnnotationDatumBase, StrokeFields, LineStyleFields {
    value?: DataPoint['x'];
    handle: HandleDatum;
    axisLabel: AxisLabelDatum;
    text: LineTextDatum;
}

export interface HorizontalLineDatum extends CrossLineTypeDatum {
    type: AnnotationType.HorizontalLine;
}

export interface VerticalLineDatum extends CrossLineTypeDatum {
    type: AnnotationType.VerticalLine;
}

export type CrossLineDatum = HorizontalLineDatum | VerticalLineDatum;

function createCrossLineTypeDatum(): Omit<CrossLineTypeDatum, 'type'> {
    return {
        ...createAnnotationDatumBase(),
        handle: createHandleDatum(),
        axisLabel: createAxisLabelDatum(),
        text: createLineTextDatum(),
    };
}

const getDefaultColor = (datum: CrossLineTypeDatum) => datum.stroke;
const getDefaultOpacity = (datum: CrossLineTypeDatum) => datum.strokeOpacity;

export const horizontalLineDatum: AnnotationDatumType<HorizontalLineDatum> = {
    create: () => ({ ...createCrossLineTypeDatum(), type: AnnotationType.HorizontalLine }),
    is: (value): value is HorizontalLineDatum => isObject(value) && value.type === AnnotationType.HorizontalLine,
    getDefaultColor,
    getDefaultOpacity,
};

export const verticalLineDatum: AnnotationDatumType<VerticalLineDatum> = {
    create: () => ({ ...createCrossLineTypeDatum(), type: AnnotationType.VerticalLine }),
    is: (value): value is VerticalLineDatum => isObject(value) && value.type === AnnotationType.VerticalLine,
    getDefaultColor,
    getDefaultOpacity,
};
