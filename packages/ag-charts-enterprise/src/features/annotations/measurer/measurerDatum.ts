import { isObject } from 'ag-charts-core';

import {
    type AnnotationDatumType,
    type BackgroundDatum,
    type FillFields,
    type FontFields,
    type HandleDatum,
    type LineStyleFields,
    type LineTextDatum,
    type StrokeFields,
    createBackgroundDatum,
    createFontFields,
    createHandleDatum,
    createLineTextDatum,
} from '../annotationDatum';
import { type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { type StartEndDatum, createStartEndDatum } from '../datum/startEndDatum';

export interface MeasurerStatisticsDatum extends FontFields, FillFields, StrokeFields {
    divider: StrokeFields;
}

export interface MeasurerDirectionDatum extends FillFields, StrokeFields {
    handle: HandleDatum;
    statistics: MeasurerStatisticsDatum;
}

export interface MeasurerTypeDatum extends StartEndDatum, StrokeFields, LineStyleFields {
    background: BackgroundDatum;
    statistics: MeasurerStatisticsDatum;
    text: LineTextDatum;
}

export interface DateRangeDatum extends MeasurerTypeDatum {
    type: AnnotationType.DateRange;
    extendAbove?: boolean;
    extendBelow?: boolean;
}

export interface PriceRangeDatum extends MeasurerTypeDatum {
    type: AnnotationType.PriceRange;
    extendLeft?: boolean;
    extendRight?: boolean;
}

export interface DatePriceRangeDatum extends MeasurerTypeDatum {
    type: AnnotationType.DatePriceRange;
}

export interface QuickDatePriceRangeDatum extends MeasurerTypeDatum {
    type: AnnotationType.QuickDatePriceRange;
    up: MeasurerDirectionDatum;
    down: MeasurerDirectionDatum;
}

export type MeasurerDatum = DateRangeDatum | PriceRangeDatum | DatePriceRangeDatum | QuickDatePriceRangeDatum;

function createStatisticsDatum(): MeasurerStatisticsDatum {
    return { ...createFontFields(), divider: {} };
}

function createDirectionDatum(): MeasurerDirectionDatum {
    return { handle: createHandleDatum(), statistics: createStatisticsDatum() };
}

function createMeasurerTypeDatum(): Omit<MeasurerTypeDatum, 'type'> {
    return {
        ...createStartEndDatum(),
        background: createBackgroundDatum(),
        statistics: createStatisticsDatum(),
        text: createLineTextDatum(),
    };
}

function getDefaultColor(datum: MeasurerTypeDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'fill-color':
            return datum.background.fill;
        case 'line-color':
            return datum.stroke;
        case 'text-color':
            return datum.text.color;
    }
}

function getDefaultOpacity(datum: MeasurerTypeDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'fill-color':
            return datum.background.fillOpacity;
        case 'line-color':
            return datum.strokeOpacity;
    }
}

export const dateRangeDatum: AnnotationDatumType<DateRangeDatum> = {
    create: () => ({ ...createMeasurerTypeDatum(), type: AnnotationType.DateRange }),
    is: (value): value is DateRangeDatum => isObject(value) && value.type === AnnotationType.DateRange,
    getDefaultColor,
    getDefaultOpacity,
};

export const priceRangeDatum: AnnotationDatumType<PriceRangeDatum> = {
    create: () => ({ ...createMeasurerTypeDatum(), type: AnnotationType.PriceRange }),
    is: (value): value is PriceRangeDatum => isObject(value) && value.type === AnnotationType.PriceRange,
    getDefaultColor,
    getDefaultOpacity,
};

export const datePriceRangeDatum: AnnotationDatumType<DatePriceRangeDatum> = {
    create: () => ({ ...createMeasurerTypeDatum(), type: AnnotationType.DatePriceRange }),
    is: (value): value is DatePriceRangeDatum => isObject(value) && value.type === AnnotationType.DatePriceRange,
    getDefaultColor,
    getDefaultOpacity,
};

export const quickDatePriceRangeDatum: AnnotationDatumType<QuickDatePriceRangeDatum> = {
    create: () => ({
        ...createMeasurerTypeDatum(),
        type: AnnotationType.QuickDatePriceRange,
        up: createDirectionDatum(),
        down: createDirectionDatum(),
    }),
    is: (value): value is QuickDatePriceRangeDatum =>
        isObject(value) && value.type === AnnotationType.QuickDatePriceRange,
    getDefaultColor,
    getDefaultOpacity,
};

export function getMeasurerDirection(datum: MeasurerDatum): 'both' | 'horizontal' | 'vertical' {
    switch (datum.type) {
        case AnnotationType.DateRange:
            return 'horizontal';
        case AnnotationType.PriceRange:
            return 'vertical';
        default:
            return 'both';
    }
}

export function hasDateRange(datum: MeasurerDatum) {
    return datum.type !== AnnotationType.PriceRange;
}

export function hasPriceRange(datum: MeasurerDatum) {
    return datum.type !== AnnotationType.DateRange;
}
