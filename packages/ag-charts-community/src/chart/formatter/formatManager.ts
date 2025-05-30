import { Logger, createNumberFormatter, isPlainObject, parseNumberFormat } from 'ag-charts-core';
import {
    type DateFormatterStyle,
    type FormatterConfiguration,
    type FormatterParams,
    type TimeIntervalUnit,
} from 'ag-charts-types';

import { Listeners } from '../../util/listeners';
import { simpleMemorize2 } from '../../util/memo';
import { buildDateFormatter } from '../../util/timeFormat';
import { defaultTimeFormats, deriveTimeSpecifier } from '../axis/timeFormatUtil';

type Specifier = Record<TimeIntervalUnit, string> | string;

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

    get hasGlobalFormatter(): boolean {
        return this.formatter != null;
    }

    format(
        params: FormatterParams<any>,
        specifier?: Record<string, string> | string,
        { includeYear = true } = {}
    ): string | undefined {
        if (params.value == null) return;

        const { formatter } = this;
        if (typeof formatter === 'function') {
            return formatter(params);
        }

        const propertyFormatter = formatter?.[params.property];

        if (typeof propertyFormatter === 'function') {
            return propertyFormatter(params);
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
}
