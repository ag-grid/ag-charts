import { Logger, createNumberFormatter, isPlainObject, parseNumberFormat } from 'ag-charts-core';
import {
    type DateFormatterStyle,
    type FormatterConfiguration,
    type FormatterParams,
    type TimeIntervalUnit,
} from 'ag-charts-types';

import { Listeners } from '../../util/listeners';
import { buildDateFormatter } from '../../util/timeFormat';
import { deriveTimeSpecifier } from '../axis/timeFormatUtil';

export class FormatManager extends Listeners<'format-changed', () => void> {
    private readonly formats = new Map<string, (value: any, _params?: any) => string | undefined>();
    private readonly componentDateFormatters = new Map<TimeIntervalUnit, (value: any) => string | undefined>();
    private readonly longDateFormatters = new Map<TimeIntervalUnit, (value: any) => string | undefined>();
    formatter: FormatterConfiguration<any> | undefined = undefined;

    static getFormatter(
        type: 'number' | 'date' | 'category',
        specifier: string | Record<TimeIntervalUnit, string>,
        unit?: TimeIntervalUnit,
        style: DateFormatterStyle | 'fixed-year-long' = 'long'
    ): (value: any, fractionDigits?: number) => string | undefined {
        if (isPlainObject(specifier)) {
            if (type !== 'date') {
                Logger.warn('Date formatter configuration is not supported for non-date types.');
                return () => undefined;
            }

            unit ??= 'millisecond';

            let fullFormat: string;
            switch (style) {
                case 'component':
                    fullFormat = specifier[unit];
                    break;
                case 'long':
                    fullFormat = deriveTimeSpecifier(specifier, unit, true);
                    break;
                case 'fixed-year-long':
                    fullFormat = deriveTimeSpecifier(specifier, unit, false);
                    break;
            }
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
            this.componentDateFormatters.clear();
            this.longDateFormatters.clear();
            this.dispatch('format-changed');
        }
    }

    format(params: FormatterParams<any>): string | undefined {
        if (params.value == null) return;

        const { formatter } = this;
        if (typeof formatter === 'function') {
            return formatter(params);
        } else if (formatter == null) {
            return;
        }

        const { property } = params;
        const propertyFormatter = formatter[property];

        if (typeof propertyFormatter === 'function') {
            return propertyFormatter(params);
        } else if (isPlainObject(propertyFormatter)) {
            if (params.type !== 'date') {
                Logger.warn('Date formatter configuration is not supported for non-date types.');
                return;
            }

            const { unit, style } = params;
            const dateFormatters = style === 'long' ? this.longDateFormatters : this.componentDateFormatters;
            let dateFormatter = dateFormatters.get(unit);
            if (dateFormatter == null) {
                dateFormatter = FormatManager.getFormatter('date', propertyFormatter, unit, style);
                dateFormatters.set(unit, dateFormatter);
            }
            return dateFormatter(params.value);
        } else if (typeof propertyFormatter !== 'string') {
            return;
        }

        let valueFormatter = this.formats.get(property);
        if (valueFormatter == null) {
            valueFormatter = FormatManager.getFormatter(params.type, propertyFormatter);
            this.formats.set(propertyFormatter, valueFormatter);
        }
        return valueFormatter(params.value, params.type === 'number' ? params.fractionDigits : undefined);
    }
}
