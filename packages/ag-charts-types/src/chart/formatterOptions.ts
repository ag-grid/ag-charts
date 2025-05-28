import type { TimeIntervalUnit } from './axisOptions';

export type FormatterPropertyType =
    | 'x'
    | 'y'
    | 'angle'
    | 'radius'
    | 'size'
    | 'color'
    | 'label'
    | 'secondaryLabel'
    | 'calloutLabel'
    | 'sectorLabel';

export type SeriesFormatterSource = 'tooltip' | 'series-label';
export type ChartFormatterSource = 'axis' | 'crosshair';
export type AnyFormatterSource = SeriesFormatterSource | ChartFormatterSource;

export interface SeriesFormatterParams<TDatum, Property, Value> {
    value: Value;
    datum: TDatum | undefined;
    key: string | undefined;
    source: SeriesFormatterSource;
    property: Property;
}

export interface ChartFormatterParams<Property, Value> {
    value: Value;
    datum: undefined;
    key: undefined;
    source: ChartFormatterSource;
    property: Property;
}

interface BaseFormatterParams<TDatum, Value> {
    value: Value;
    datum: TDatum | undefined;
    key: string | undefined;
    source: AnyFormatterSource;
    property: FormatterPropertyType;
}

export interface NumberFormatterParams<TDatum> extends BaseFormatterParams<TDatum, number> {
    type: 'number';
    fractionDigits: number | undefined;
}

export type DateFormatterStyle = 'long' | 'component';

export interface DateFormatterParams<TDatum> extends BaseFormatterParams<TDatum, Date | number> {
    type: 'date';
    unit: TimeIntervalUnit;
    step: number;
    epoch: Date | undefined;
    style: DateFormatterStyle;
}

export interface CategoryFormatterParams<TDatum> extends BaseFormatterParams<TDatum, string | number | Date> {
    type: 'category';
}

export type FormatterParams<TDatum> =
    | NumberFormatterParams<TDatum>
    | DateFormatterParams<TDatum>
    | CategoryFormatterParams<TDatum>;

type FunctionFormatter<TDatum> = (params: FormatterParams<TDatum>) => string | undefined;
type TimeIntervalFormatter = Record<TimeIntervalUnit, string>;

export type FormatterConfiguration<TDatum> =
    | FunctionFormatter<TDatum>
    | Partial<Record<FormatterPropertyType, FunctionFormatter<TDatum> | TimeIntervalFormatter | string>>;
