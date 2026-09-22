import type { AgAnnotationLineStyleType, FontStyle, FontWeight, Formatter, TextAlign } from 'ag-charts-community';
import { FONT_SIZE, generateUUID } from 'ag-charts-core';
import type { Padding } from 'ag-charts-types';

import type {
    AnnotationOptionsColorPickerType,
    AnnotationType,
    ChannelTextPosition,
    DataPoint,
    LineTextAlignment,
    LineTextPosition,
} from './annotationTypes';

/****************
 * Field groups *
 ****************/

export interface FillFields {
    fill?: string;
    fillOpacity?: number;
}

export interface StrokeFields {
    stroke?: string;
    strokeOpacity?: number;
    strokeWidth?: number;
}

export interface LineStyleFields {
    lineDash?: number[];
    lineDashOffset?: number;
    lineStyle?: AgAnnotationLineStyleType;
}

export interface FontFields {
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize: number;
    fontFamily: string;
    color?: string;
}

export interface LabelFields {
    padding?: number;
    textAlign: TextAlign;
    formatter?: Formatter<AxisLabelFormatterParams>;
}

export interface ExtendableFields {
    extendStart?: boolean;
    extendEnd?: boolean;
}

export interface AxisLabelFormatterParams {
    readonly value: any;
}

/*****************
 * Nested datums *
 *****************/

export interface HandleDatum extends StrokeFields, LineStyleFields, FillFields {}

export interface BackgroundDatum extends FillFields {}

export interface ChannelMiddleDatum extends StrokeFields, LineStyleFields {
    visible?: boolean;
}

export interface AxisLabelDatum extends StrokeFields, LineStyleFields, FillFields, FontFields {
    enabled?: boolean;
    cornerRadius: number;
    textAlign: TextAlign;
    formatter?: Formatter<AxisLabelFormatterParams>;
    padding?: Padding;
}

export interface LineTextDatum extends FontFields {
    label: string;
    position?: LineTextPosition;
    alignment?: LineTextAlignment;
}

export interface ChannelTextDatum extends FontFields {
    label: string;
    position?: ChannelTextPosition;
    alignment?: LineTextAlignment;
}

export type LabelTextDatum = FontFields;

/***************
 * Base datums *
 ***************/

export interface AnnotationDatumBase {
    // A uuid is required, over the usual incrementing index, as annotations can be restored from external databases
    id: string;
    type: AnnotationType;
    visible?: boolean;
    locked?: boolean;
    readOnly?: boolean;
}

export interface StartEndFields {
    start: DataPoint;
    end: DataPoint;
    handle: HandleDatum;
}

export interface PointFields {
    x?: DataPoint['x'];
    y?: DataPoint['y'];
    handle: HandleDatum;
}

/**
 * Per-type behaviour of a plain-object annotation datum, referenced from the annotation's config.
 */
export interface AnnotationDatumType<Datum extends AnnotationDatumBase> {
    create(): Datum;
    is(value: unknown): value is Datum;
    getDefaultColor(datum: Datum, colorPickerType: AnnotationOptionsColorPickerType): string | undefined;
    getDefaultOpacity(datum: Datum, colorPickerType: AnnotationOptionsColorPickerType): number | undefined;
    isHoverable?(datum: Datum): boolean;
}

/*************
 * Factories *
 *************/

export const DEFAULT_ANNOTATION_FONT_FAMILY =
    '"IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';

export function createFontFields(): FontFields {
    return { fontSize: FONT_SIZE.SMALL, fontFamily: DEFAULT_ANNOTATION_FONT_FAMILY };
}

export function createLabelFields(): LabelFields {
    return { textAlign: 'center' };
}

export function createHandleDatum(): HandleDatum {
    return {};
}

export function createBackgroundDatum(): BackgroundDatum {
    return {};
}

export function createChannelMiddleDatum(): ChannelMiddleDatum {
    return {};
}

export function createAxisLabelDatum(): AxisLabelDatum {
    return { ...createFontFields(), cornerRadius: 2, textAlign: 'center' };
}

export function createLineTextDatum(): LineTextDatum {
    return { ...createFontFields(), label: '', position: 'top', alignment: 'left' };
}

export function createChannelTextDatum(): ChannelTextDatum {
    return { ...createFontFields(), label: '' };
}

export function createLabelTextDatum(): LabelTextDatum {
    return createFontFields();
}

export function createAnnotationDatumBase(): Omit<AnnotationDatumBase, 'type'> {
    return { id: generateUUID() };
}

export function createStartEndFields(): StartEndFields {
    return { start: {}, end: {}, handle: createHandleDatum() };
}

export function createPointFields(): PointFields {
    return { handle: createHandleDatum() };
}
