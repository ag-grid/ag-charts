import {
    type AnnotationDatumBase,
    type AxisLabelDatum,
    type HandleDatum,
    type LineStyleFields,
    type LineTextDatum,
    type StrokeFields,
    createAnnotationDatumBase,
    createAxisLabelDatum,
    createHandleDatum,
    createLineTextDatum,
    defineAnnotationDatum,
} from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import type { PointType } from '../utils/scale';

export interface CrossLineTypeDatum extends AnnotationDatumBase, StrokeFields, LineStyleFields {
    value?: PointType;
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

const getCrossLineDefaultColor = (datum: CrossLineTypeDatum) => datum.stroke;
const getCrossLineDefaultOpacity = (datum: CrossLineTypeDatum) => datum.strokeOpacity;

export const horizontalLineDatum = defineAnnotationDatum<HorizontalLineDatum>(
    AnnotationType.HorizontalLine,
    createCrossLineTypeDatum,
    {
        getDefaultColor: getCrossLineDefaultColor,
        getDefaultOpacity: getCrossLineDefaultOpacity,
    }
);

export const verticalLineDatum = defineAnnotationDatum<VerticalLineDatum>(
    AnnotationType.VerticalLine,
    createCrossLineTypeDatum,
    {
        getDefaultColor: getCrossLineDefaultColor,
        getDefaultOpacity: getCrossLineDefaultOpacity,
    }
);
