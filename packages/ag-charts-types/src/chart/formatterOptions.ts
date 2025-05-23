import type { TimeIntervalUnit } from './axisOptions';

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

interface BaseFormatterParams<TDatum, Property, Value> {
    value: Value;
    datum: TDatum | undefined;
    key: string | undefined;
    source: AnyFormatterSource;
    property: Property;
}

export interface NumberFormatterParams<TDatum, Property> extends BaseFormatterParams<TDatum, Property, number> {
    type: 'number';
    fractionDigits: number | undefined;
}

export type DateFormatterStyle = 'long' | 'component';

export interface DateFormatterParams<TDatum, Property> extends BaseFormatterParams<TDatum, Property, Date | number> {
    type: 'date';
    unit: TimeIntervalUnit;
    step: number;
    epoch: Date | undefined;
    style: DateFormatterStyle;
}

export interface CategoryFormatterParams<TDatum, Property>
    extends BaseFormatterParams<TDatum, Property, string | number | Date> {
    type: 'category';
}

export type FormatterParams<TDatum, Property> =
    | NumberFormatterParams<TDatum, Property>
    | DateFormatterParams<TDatum, Property>
    | CategoryFormatterParams<TDatum, Property>;

type FunctionFormatter<TDatum, Property> = (params: FormatterParams<TDatum, Property>) => string | undefined;
type TimeIntervalFormatter = Record<TimeIntervalUnit, string>;

export type FormatterConfiguration<TDatum, Property extends string = any> =
    | FunctionFormatter<TDatum, Property>
    | Partial<Record<Property, FunctionFormatter<TDatum, Property> | TimeIntervalFormatter | string>>;
