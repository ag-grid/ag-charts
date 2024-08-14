import type { Formatter, MessageFormatterParams } from 'ag-charts-types';

import { Logger } from '../../util/logger';

const messageRegExp = /\$\{(\w+)}(?:\[(\w+)])?/gi;

const formatters: Record<string, { format(value: unknown): string }> = {
    number: new Intl.NumberFormat('en-US'),
    percent: new Intl.NumberFormat('en-US', { style: 'percent' }),
    date: new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }),
    time: new Intl.DateTimeFormat('en-US', { timeStyle: 'full' }),
    datetime: new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'full' }),
};

export const defaultMessageFormatter: Formatter<MessageFormatterParams> = ({ defaultValue, variables }) => {
    return defaultValue?.replaceAll(messageRegExp, (_, match, format) => {
        const value = variables[match];
        const formatter = format != null ? formatters[format] : null;

        if (format != null && formatter == null) {
            Logger.warnOnce(`Format style [${format}] is not supported`);
        }

        if (formatter != null) {
            return formatter.format(value);
        } else if (typeof value === 'number') {
            return formatters.number.format(value);
        } else if (value instanceof Date) {
            return formatters.datetime.format(value);
        }
        return String(value);
    });
};
