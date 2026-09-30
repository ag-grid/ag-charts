import {
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
    defineAnnotationDatum,
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

function getMeasurerDefaultColor(datum: MeasurerTypeDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'fill-color':
            return datum.background.fill;
        case 'line-color':
            return datum.stroke;
        case 'text-color':
            return datum.text.color;
    }
}

function getMeasurerDefaultOpacity(datum: MeasurerTypeDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'fill-color':
            return datum.background.fillOpacity;
        case 'line-color':
            return datum.strokeOpacity;
    }
}

export const dateRangeDatum = defineAnnotationDatum<DateRangeDatum>(AnnotationType.DateRange, createMeasurerTypeDatum, {
    getDefaultColor: getMeasurerDefaultColor,
    getDefaultOpacity: getMeasurerDefaultOpacity,
});

export const priceRangeDatum = defineAnnotationDatum<PriceRangeDatum>(
    AnnotationType.PriceRange,
    createMeasurerTypeDatum,
    {
        getDefaultColor: getMeasurerDefaultColor,
        getDefaultOpacity: getMeasurerDefaultOpacity,
    }
);

export const datePriceRangeDatum = defineAnnotationDatum<DatePriceRangeDatum>(
    AnnotationType.DatePriceRange,
    createMeasurerTypeDatum,
    {
        getDefaultColor: getMeasurerDefaultColor,
        getDefaultOpacity: getMeasurerDefaultOpacity,
    }
);

export const quickDatePriceRangeDatum = defineAnnotationDatum<QuickDatePriceRangeDatum>(
    AnnotationType.QuickDatePriceRange,
    () => ({ ...createMeasurerTypeDatum(), up: createDirectionDatum(), down: createDirectionDatum() }),
    {
        getDefaultColor: getMeasurerDefaultColor,
        getDefaultOpacity: getMeasurerDefaultOpacity,
    }
);

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
