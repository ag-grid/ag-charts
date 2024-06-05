import type { MessageFormatter } from '../../options/chart/localeOptions';
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

export const defaultMessageFormatter: MessageFormatter<string> = ({ message, params }) => {
    return message.replaceAll(messageRegExp, (_, match, format) => {
        let value = params[match];
        if (format) {
            const formatter = formatters[format];
            if (formatter == null) {
                Logger.warnOnce(`Format style [${format}] is not supported`);
            } else {
                value = formatter.format(value);
            }
        }
        return value;
    });
};
