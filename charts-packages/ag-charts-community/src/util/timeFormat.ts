const CONSTANTS = {
    periods: ['AM', 'PM'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ],
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

type FormattingFn = (dateTime: Date, paddingChar?: string) => string;
type PaddingString = ' ' | '0' | '';
type FormattingString = string;
type LiteralString = string;

function dayOfYear(date: Date, startOfYear = new Date(date.getFullYear(), 0, 1)) {
    const startOffset = date.getTimezoneOffset() - startOfYear.getTimezoneOffset();
    const timeDiff = date.getTime() - startOfYear.getTime() + startOffset * 60_000;
    const timeOneDay = 3_600_000 * 24;
    return Math.floor(timeDiff / timeOneDay);
}

function weekOfYear(date: Date, startDay: number): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const startOfYearDay = startOfYear.getDay();
    const firstWeekStartOffset = (startDay - startOfYearDay + 7) % 7;
    const startOffset = new Date(date.getFullYear(), 0, firstWeekStartOffset + 1);

    if (startOffset <= date) {
        return Math.floor(dayOfYear(date, startOffset) / 7) + 1;
    }

    // Days before week 1 are in week 0.
    return 0;
}

const SUNDAY = 0;
const MONDAY = 1;
const THURSDAY = 4;

function isoWeekOfYear(date: Date, year = date.getFullYear()): number {
    const firstOfYear = new Date(year, 0, 1);
    const firstOfYearDay = firstOfYear.getDay();
    const firstThursdayOffset = (THURSDAY - firstOfYearDay + 7) % 7;
    const startOffset = new Date(year, 0, firstThursdayOffset - (THURSDAY - MONDAY) + 1);

    if (startOffset <= date) {
        return Math.floor(dayOfYear(date, startOffset) / 7) + 1;
    }

    // Days before week 1 are in week 52/53 of previous year.
    return isoWeekOfYear(date, year - 1);
}

function timezone(date: Date) {
    const offset = date.getTimezoneOffset();
    const unsignedOffset = Math.abs(offset);
    const sign = offset > 0 ? '-' : '+';
    return `${sign}${pad(Math.floor(unsignedOffset / 60), 2, '0')}${pad(Math.floor(unsignedOffset % 60), 2, '0')}`;
}

const FORMATTERS: Record<string, FormattingFn | FormattingString> = {
    a: (d) => CONSTANTS.shortDays[d.getDay()],
    A: (d) => CONSTANTS.days[d.getDay()],
    b: (d) => CONSTANTS.shortMonths[d.getMonth()],
    B: (d) => CONSTANTS.months[d.getMonth()],
    c: '%x, %X',
    d: (d, p) => pad(d.getDate(), 2, p ?? '0'),
    e: '%_d',
    f: (d, p) => pad(d.getMilliseconds() * 1000, 6, p ?? '0'),
    H: (d, p) => pad(d.getHours(), 2, p ?? '0'),
    I: (d, p) => {
        const hours = d.getHours() % 12;
        return hours === 0 ? '12' : pad(hours, 2, p ?? '0');
    },
    j: (d, p) => pad(dayOfYear(d) + 1, 3, p ?? '0'),
    m: (d, p) => pad(d.getMonth() + 1, 2, p ?? '0'),
    M: (d, p) => pad(d.getMinutes(), 2, p ?? '0'),
    L: (d, p) => pad(d.getMilliseconds(), 3, p ?? '0'),
    p: (d) => (d.getHours() < 12 ? 'AM' : 'PM'),
    Q: (d) => String(d.getTime()),
    s: (d) => String(Math.floor(d.getTime() / 1000)),
    S: (d, p) => pad(d.getSeconds(), 2, p ?? '0'),
    u: (d) => {
        let day = d.getDay();
        if (day < 1) day += 7;
        return String(day % 7);
    },
    U: (d, p) => pad(weekOfYear(d, SUNDAY), 2, p ?? '0'),
    V: (d, p) => pad(isoWeekOfYear(d), 2, p ?? '0'),
    w: (d, p) => pad(d.getDay(), 2, p ?? '0'),
    W: (d, p) => pad(weekOfYear(d, MONDAY), 2, p ?? '0'),
    x: '%-m/%-d/%Y',
    X: '%-I:%M:%S %p',
    y: (d, p) => pad(d.getFullYear() % 100, 2, p ?? '0'),
    Y: (d, p) => pad(d.getFullYear(), 4, p ?? '0'),
    Z: (d) => timezone(d),
    '%': () => '%',
};

const PADS: Record<string, PaddingString> = {
    _: ' ',
    '0': '0',
    '-': '',
};

function pad(value: number, size: number, padChar: string) {
    const output = String(Math.floor(value));
    if (output.length >= size) {
        return output;
    }

    return `${padChar.repeat(size - output.length)}${output}`;
}

export function buildFormatter(formatString: string): FormattingFn {
    const formatParts: (LiteralString | [FormattingFn, PaddingString])[] = [];

    while (formatString.length > 0) {
        let nextEscapeIdx = formatString.indexOf('%');

        if (nextEscapeIdx !== 0) {
            const literalPart = nextEscapeIdx > 0 ? formatString.substring(0, nextEscapeIdx) : formatString;
            formatParts.push(literalPart);
        }

        if (nextEscapeIdx < 0) break;

        const maybePadSpecifier = formatString[nextEscapeIdx + 1];
        const maybePad = PADS[maybePadSpecifier];
        if (maybePad != null) {
            nextEscapeIdx++;
        }

        const maybeFormatterSpecifier = formatString[nextEscapeIdx + 1];
        const maybeFormatter = FORMATTERS[maybeFormatterSpecifier];
        if (typeof maybeFormatter === 'function') {
            formatParts.push([maybeFormatter, maybePad]);
        } else if (typeof maybeFormatter === 'string') {
            const formatter = buildFormatter(maybeFormatter);
            formatParts.push([formatter, maybePad]);
        } else {
            formatParts.push(`${maybePad ?? ''}${maybeFormatterSpecifier}`);
        }

        formatString = formatString.substring(nextEscapeIdx + 2);
    }

    return (dateTime: Date | number) => {
        const dateTimeAsDate = typeof dateTime === 'number' ? new Date(dateTime) : dateTime;

        return formatParts.map((c) => (typeof c === 'string' ? c : c[0](dateTimeAsDate, c[1]))).join('');
    };
}
