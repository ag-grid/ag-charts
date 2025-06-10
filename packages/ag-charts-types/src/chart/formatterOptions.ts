import type { TimeIntervalUnit } from './axisOptions';
import type { TDatumDefault } from './types';

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
export type ChartFormatterSource = 'axis' | 'gradient-legend' | 'crosshair' | 'annotation';
export type AnyFormatterSource = SeriesFormatterSource | ChartFormatterSource;

interface FormatterBoundSeries {
    /** Key used by the series for values on the related axis. */
    key: string;
    /** Optional name used by the series for values on the related axis. */
    name?: string;
}

export interface SeriesFormatterParams<TDatum, Value> {
    value: Value;
    datum: TDatum | undefined;
    seriesId: string | undefined;
    key: TDatum extends object ? keyof TDatum & string : string | undefined;
    source: SeriesFormatterSource;
    property: FormatterPropertyType;
}

export interface ChartFormatterParams<Value> {
    value: Value;
    datum: undefined;
    seriesId: undefined;
    key: undefined;
    source: ChartFormatterSource;
    property: FormatterPropertyType;
}

interface BaseFormatterParams<TDatum, Value> {
    value: Value;
    datum: TDatum | undefined;
    seriesId: string | undefined;
    key: TDatum extends object ? keyof TDatum & string : string | undefined;
    source: AnyFormatterSource;
    property: FormatterPropertyType;
    domain: any[];
    boundSeries: FormatterBoundSeries[];
}

export interface NumberFormatterParams<TDatum> extends BaseFormatterParams<TDatum, number> {
    type: 'number';
    fractionDigits: number | undefined;
}

export type DateFormatterStyle = 'long' | 'component';

export interface DateFormatterParams<TDatum> extends BaseFormatterParams<TDatum, Date> {
    type: 'date';
    unit: TimeIntervalUnit;
    step: number;
    epoch: Date | undefined;
    style: DateFormatterStyle;
}

export interface CategoryFormatterParams<TDatum>
    extends BaseFormatterParams<TDatum, string | number | Date | string[]> {
    type: 'category';
}

export type FormatterParams<TDatum = TDatumDefault> =
    | NumberFormatterParams<TDatum>
    | DateFormatterParams<TDatum>
    | CategoryFormatterParams<TDatum>;

type FunctionFormatter<TDatum> = (params: FormatterParams<TDatum>) => string | undefined;
type TimeIntervalFormatter = Record<TimeIntervalUnit, string>;

export type FormatterConfiguration<TDatum> =
    | FunctionFormatter<TDatum>
    | Partial<Record<FormatterPropertyType, FunctionFormatter<TDatum> | TimeIntervalFormatter | string>>;
