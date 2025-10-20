type FormattingFn = (dateTime: Date | number, paddingChar?: string) => string;

function pad(value: number, size: number, padChar = '0') {
    return String(Math.floor(value)).padStart(size, padChar);
}

function dayOfYear(date: Date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function weekOfYear(date: Date, startDay: number) {
    const jan1 = new Date(date.getFullYear(), 0, 1);
    const firstWeekStartOffset = (startDay - jan1.getDay() + 7) % 7;
    const firstWeekStart = new Date(date.getFullYear(), 0, 1 + firstWeekStartOffset);
    if (date < firstWeekStart) return 0;
    const diffDays = Math.floor((date.getTime() - firstWeekStart.getTime()) / (1000*60*60*24));
    return Math.floor(diffDays / 7) + 1;
}

function isoWeekOfYear(date: Date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7; // Monday=0
    target.setDate(target.getDate() - dayNr + 3); // move to Thursday in current week
    const firstThursday = new Date(target.getFullYear(), 0, 4); // Jan 4
    const diff = target.getTime() - firstThursday.getTime();
    return 1 + Math.round(diff / (1000 * 60 * 60 * 24 * 7));
}

function timezone(date: Date) {
    const offset = date.getTimezoneOffset();
    const sign = offset > 0 ? '-' : '+';
    const absOffset = Math.abs(offset);
    return `${sign}${pad(Math.floor(absOffset / 60), 2)}${pad(absOffset % 60, 2)}`;
}

export type LocaleString = 'en-US';

export function buildDateFormatter(locale: string | string[], formatString: string): FormattingFn {
    const formatParts: ((date: Date) => string)[] = [];

    const re = /%([-_0]?)([a-zA-Z%])/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(formatString)) !== null) {
        if (match.index > lastIndex) {
            // preserve literal characters exactly
            const literal = formatString.slice(lastIndex, match.index);
            formatParts.push(() => literal);
        }

        const padCharMap: Record<string, string> = { '0': '0', '_': ' ', '-': '' };
        const padChar = padCharMap[match[1]] ?? '0';
        const spec = match[2];

        formatParts.push((date) => {
            switch (spec) {
                case 'a': return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
                case 'A': return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
                case 'b': return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
                case 'B': return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
                case 'c': return new Intl.DateTimeFormat(locale, {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                }).format(date);
                case 'd': return pad(date.getDate(), 2, padChar);
                case 'e': return pad(date.getDate(), 2, padCharMap['_']);
                case 'f': return pad(date.getMilliseconds() * 1000, 6, padChar);
                case 'H': return pad(date.getHours(), 2, padChar);
                case 'I': { const h = date.getHours() % 12 || 12; return pad(h, 2, padChar); }
                case 'j': return pad(dayOfYear(date), 3, padChar);
                case 'm': return pad(date.getMonth() + 1, 2, padChar);
                case 'M': return pad(date.getMinutes(), 2, padChar);
                case 'L': return pad(date.getMilliseconds(), 3, padChar);
                case 'p': return date.getHours() < 12 ? 'AM' : 'PM';
                case 'Q': return String(date.getTime());
                case 's': return String(Math.floor(date.getTime() / 1000));
                case 'S': return pad(date.getSeconds(), 2, padChar);
                case 'u': return String(date.getDay() || 7);
                case 'U': return pad(weekOfYear(date, 0), 2, padChar);
                case 'V': return pad(isoWeekOfYear(date), 2, padChar);
                case 'w': return String(date.getDay());
                case 'W': return pad(weekOfYear(date, 1), 2, padChar);
                case 'x': return new Intl.DateTimeFormat(locale).format(date);
                case 'X': return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(date);
                case 'y': return pad(date.getFullYear() % 100, 2, padChar);
                case 'Y': return String(date.getFullYear());
                case 'Z': return timezone(date);
                default: return `${spec}`;
            }
        });

        lastIndex = re.lastIndex;
    }

    if (lastIndex < formatString.length) {
        formatParts.push(() => formatString.slice(lastIndex));
    }

    return (dateTime: Date | number) => {
        const date = typeof dateTime === 'number' ? new Date(dateTime) : dateTime;
        return formatParts.map((fn) => fn(date)).join('');
    };
}
