import { Logger, createNumberFormatter, isPlainObject, parseNumberFormat } from 'ag-charts-core';
import {
    type DateFormatterStyle,
    type FormatterConfiguration,
    type FormatterParams,
    type TimeIntervalUnit,
} from 'ag-charts-types';

import { formatValue } from '../../util/format.util';
import { Listeners } from '../../util/listeners';
import { simpleMemorize2 } from '../../util/memo';
import { buildDateFormatter } from '../../util/timeFormat';
import { defaultTimeFormats, deriveTimeSpecifier } from '../axis/timeFormatUtil';

export type ContextFormatter = (
    fn: (params: FormatterParams<any>) => string | undefined,
    params: FormatterParams<any>
) => string | undefined;

type Specifier = Record<TimeIntervalUnit, string> | string;

interface FormatParams {
    specifier?: Record<string, string> | string;
    includeYear?: boolean;
}

export class FormatManager extends Listeners<'format-changed', () => void> {
    private readonly formats = new Map<string, ((value: any, _params?: any) => string) | undefined>();
    private readonly dateFormatter = simpleMemorize2(
        (
            propertyFormatter: Specifier | undefined,
            specifier: Specifier | undefined,
            unit: TimeIntervalUnit,
            style: DateFormatterStyle,
            includeYear: boolean
        ) => {
            const mergedFormatter = FormatManager.mergeSpecifiers(propertyFormatter, specifier) ?? defaultTimeFormats;
            return FormatManager.getFormatter('date', mergedFormatter, unit, style, { includeYear });
        }
    );
    formatter: FormatterConfiguration<any> | undefined = undefined;

    static mergeSpecifiers(a: Specifier | undefined, ...specifiers: Array<Specifier>): Specifier;
    static mergeSpecifiers(a: Specifier, ...specifiers: Array<Specifier | undefined>): Specifier;
    static mergeSpecifiers(...specifiers: Array<Specifier | undefined>): Specifier | undefined;
    static mergeSpecifiers(...specifiers: Array<Specifier | undefined>): Specifier | undefined {
        let out: Specifier | undefined;
        for (const specifier of specifiers) {
            if (typeof specifier === 'string') {
                out = specifier;
            } else if (isPlainObject(specifier)) {
                out = isPlainObject(out) ? { ...out, ...specifier } : specifier;
            }
        }
        return out;
    }

    static getFormatter(
        type: 'number' | 'date' | 'category',
        specifier: string | Partial<Record<TimeIntervalUnit, string>>,
        unit?: TimeIntervalUnit,
        style: DateFormatterStyle = 'long',
        { includeYear = true } = {}
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
                    : deriveTimeSpecifier(specifier, unit, includeYear);

            return buildDateFormatter(fullFormat) as (value: any) => string;
        }

        switch (type) {
            case 'number':
                const options = parseNumberFormat(specifier);
                if (options == null) return;
                return createNumberFormatter(options);
            case 'date':
                return buildDateFormatter(specifier) as (value: any) => string;
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
        formatInContext: ContextFormatter,
        params: FormatterParams<any>,
        { specifier, includeYear = true }: FormatParams = {}
    ): string | undefined {
        if (params.value == null) return;

        const { formatter } = this;
        if (formatter == null) return;
        if (typeof formatter === 'function') {
            const value = formatInContext(formatter, params);
            return value != null ? String(value) : undefined;
        }

        const propertyFormatter = formatter[params.property];
        if (propertyFormatter == null) return;

        if (typeof propertyFormatter === 'function') {
            const value = formatInContext(propertyFormatter, params);
            return value != null ? String(value) : undefined;
        } else if (params.type === 'date') {
            const { unit, style } = params;
            const dateFormatter = this.dateFormatter(propertyFormatter, specifier, unit, style, includeYear);
            return dateFormatter?.(params.value);
        }

        const valueSpecifier = specifier ?? propertyFormatter;
        if (typeof valueSpecifier !== 'string') return;

        let valueFormatter = this.formats.get(valueSpecifier);
        if (valueFormatter == null) {
            valueFormatter = FormatManager.getFormatter(params.type, valueSpecifier);
            this.formats.set(valueSpecifier, valueFormatter);
        }
        return valueFormatter?.(params.value, params.type === 'number' ? params.fractionDigits : undefined);
    }

    defaultFormat(params: FormatterParams<any>, { specifier, includeYear = true }: FormatParams = {}): string {
        const { formatter } = this;
        const propertyFormatter = typeof formatter === 'function' ? undefined : formatter?.[params.property];

        switch (params.type) {
            case 'date': {
                const { unit, style } = params;
                const propertySpecifier =
                    propertyFormatter != null && typeof propertyFormatter !== 'function'
                        ? propertyFormatter
                        : undefined;
                const dateFormatter = this.dateFormatter(propertySpecifier, specifier, unit, style, includeYear);
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
