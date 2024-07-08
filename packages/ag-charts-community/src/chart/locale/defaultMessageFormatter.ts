import type { MessageFormatter } from 'ag-charts-types';

import { Logger } from '../../util/logger';

const messageRegExp = /\$\{(\w+)\}(?:\[(\w+)\])?/gi;

interface Formatter {
    format(value: any): string;
}

const formatters: Record<string, Formatter> = {
    number: new Intl.NumberFormat('en-US'),
    percent: new Intl.NumberFormat('en-US', { style: 'percent' }),
    date: new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }),
    time: new Intl.DateTimeFormat('en-US', { timeStyle: 'full' }),
    datetime: new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'full' }),
};

export const defaultMessageFormatter: MessageFormatter = ({ defaultValue, variables }) => {
    return defaultValue?.replaceAll(messageRegExp, (_, match, format) => {
        const value = variables[match];
        const formatter = format != null ? formatters[format] : undefined;

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
        return value;
    });
};
