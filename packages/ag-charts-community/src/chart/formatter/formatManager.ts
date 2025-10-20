import {
    Logger,
    buildDateFormatter,
    createNumberFormatter,
    isArray,
    isPlainObject,
    parseNumberFormat,
} from 'ag-charts-core';
import {
    type AgTimeIntervalUnit,
    type CategoryFormatterParams,
    type DateFormatterParams,
    type DateFormatterStyle,
    type FormatterConfiguration,
    type NumberFormatterParams,
} from 'ag-charts-types';

import { formatValue } from '../../util/format.util';
import { Listeners } from '../../util/listeners';
import { simpleMemorize2 } from '../../util/memo';
import { defaultTimeFormats, deriveTimeSpecifier } from '../axis/timeFormatUtil';

export type GlobalContextlessFormatterParams =
    | Omit<NumberFormatterParams<any, any>, 'context'>
    | Omit<DateFormatterParams<any, any>, 'context'>
    | Omit<CategoryFormatterParams<any, any>, 'context'>;

export type GlobalContextFormatter = (
    fn: (params: GlobalContextlessFormatterParams) => string | undefined,
    params: GlobalContextlessFormatterParams,
    contextProvider?: { context?: unknown }
) => string | undefined;

type Specifier = Record<AgTimeIntervalUnit, string> | string;

interface FormatParams {
    specifier?: Record<string, string> | string;
    truncateDate?: 'year' | 'month' | 'day';
}

export class FormatManager extends Listeners<'format-changed', () => void> {
    static readonly FALLBACK_LOCALE = 'en-US';

    private readonly formats = new Map<string, ((value: any, _params?: any) => string) | undefined>();
    private readonly dateFormatter = simpleMemorize2(
        (
            propertyFormatter: Specifier | undefined,
            specifier: Specifier | undefined,
            unit: AgTimeIntervalUnit,
            style: DateFormatterStyle,
            truncateDate: FormatParams['truncateDate']
        ) => {
            const mergedFormatter = FormatManager.mergeSpecifiers(propertyFormatter, specifier) ?? defaultTimeFormats;
            return FormatManager.getFormatter(this.locale, 'date', mergedFormatter, unit, style, { truncateDate });
        }
    );
    formatter: FormatterConfiguration<any> | undefined = undefined;

    constructor(public readonly locale: string) {
        super();
    }

    static mergeSpecifiers(a: Specifier | undefined, ...specifiers: Array<Specifier>): Specifier;
    static mergeSpecifiers(a: Specifier, ...specifiers: Array<Specifier | undefined>): Specifier;
    static mergeSpecifiers(...specifiers: Array<Specifier | undefined>): Specifier | undefined;
    static mergeSpecifiers(...specifiers: Array<Specifier | undefined>): Specifier | undefined {
        let out: Specifier | undefined;
        for (const specifier of specifiers) {
            if (isPlainObject(specifier) && isPlainObject(out)) {
                out = { ...out, ...specifier };
            } else {
                out = specifier;
            }
        }
        return out;
    }

    static getFormatter(
        locale: string,
        type: 'number' | 'date' | 'category',
        specifier: string | Partial<Record<AgTimeIntervalUnit, string>>,
        unit?: AgTimeIntervalUnit,
        style: DateFormatterStyle = 'long',
        { truncateDate }: { truncateDate?: FormatParams['truncateDate'] } = {}
    ): ((value: any, fractionDigits?: number) => string) | undefined {
        if (isPlainObject(specifier)) {
            if (type !== 'date') {
                Logger.warn('Date formatter configuration is not supported for non-date types.');
                return;
            }

            unit ??= 'millisecond';

            const fullFormat =
                style === 'component'
                    ? specifier?.[unit] ?? defaultTimeFormats[unit]
                    : deriveTimeSpecifier(specifier, unit, truncateDate);

            return buildDateFormatter(locale, fullFormat) as (value: any) => string;
        }

        switch (type) {
            case 'number': {
                const options = parseNumberFormat(specifier);
                if (options == null) return;
                return createNumberFormatter(options);
            }
            case 'date':
                return buildDateFormatter(locale, specifier) as (value: any) => string;
            case 'category':
                return (value) => specifier.replace('%s', String(value));
        }
    }

    setFormatter(formatter: FormatterConfiguration<any> | undefined) {
        if (this.formatter !== formatter) {
            this.formatter = formatter;
            this.formats.clear();
            this.dateFormatter.reset();
            this.dispatch('format-changed');
        }
    }

    format(
        formatInContext: GlobalContextFormatter,
        params: GlobalContextlessFormatterParams,
        { specifier, truncateDate }: FormatParams = {}
    ): string | undefined {
        if (params.value == null) return;

        const { formatter } = this;
        if (formatter == null) return;
        if (typeof formatter === 'function') {
            const value = formatInContext(formatter, params);
            return value == null ? undefined : String(value);
        }

        const propertyFormatter = formatter[params.property];
        if (propertyFormatter == null) return;

        if (typeof propertyFormatter === 'function') {
            const value = formatInContext(propertyFormatter, params);
            return value == null || isArray(value) ? value : String(value);
        } else if (params.type === 'date') {
            const { unit, style } = params;
            const dateFormatter = this.dateFormatter(propertyFormatter, specifier, unit, style, truncateDate);
            return dateFormatter?.(params.value);
        }

        const valueSpecifier = specifier ?? propertyFormatter;
        if (typeof valueSpecifier !== 'string') return;

        let valueFormatter = this.formats.get(valueSpecifier);
        if (valueFormatter == null) {
            valueFormatter = FormatManager.getFormatter(FormatManager.FALLBACK_LOCALE, params.type, valueSpecifier);
            this.formats.set(valueSpecifier, valueFormatter);
        }
        return valueFormatter?.(params.value, params.type === 'number' ? params.fractionDigits : undefined);
    }

    defaultFormat(params: GlobalContextlessFormatterParams, { specifier, truncateDate }: FormatParams = {}): string {
        const { formatter } = this;
        const propertyFormatter = typeof formatter === 'function' ? undefined : formatter?.[params.property];

        switch (params.type) {
            case 'date': {
                const { unit, style } = params;
                const propertySpecifier =
                    propertyFormatter != null && typeof propertyFormatter !== 'function'
                        ? propertyFormatter
                        : undefined;
                const dateFormatter = this.dateFormatter(propertySpecifier, specifier, unit, style, truncateDate);
                return dateFormatter?.(params.value) ?? String(params.value);
            }

            case 'number':
                return formatValue(params.value, params.fractionDigits);

            case 'category':
                if (Array.isArray(params.value)) {
                    return params.value.join(' - ');
                } else if (typeof params.value === 'string') {
                    return params.value;
                } else if (typeof params.value === 'number') {
                    return formatValue(params.value);
                } else {
                    return String(params.value);
                }
        }
    }
}
