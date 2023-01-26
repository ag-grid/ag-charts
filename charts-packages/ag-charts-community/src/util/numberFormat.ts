import { tickStep } from './ticks';

interface FormatterOptions {
    prefix?: string;
    fill?: string;
    align?: string;
    sign?: string;
    symbol?: string;
    zero?: string;
    width?: number;
    comma?: string;
    precision?: number;
    trim?: boolean;
    type?: string;
    suffix?: string;
}

const group = (content: string) => `(${content})`;
const optionalGroup = (content: string) => `${group(content)}?`;
const nonCapturingGroup = (content: string) => optionalGroup(`?:${content}`);

const formatRegEx = (() => {
    const fill = '.';
    const align = '[<>=^]';
    const sign = '[+\\-( ]';
    const symbol = '[$€£¥₣₹#]';
    const zero = '0';
    const width = '\\d+';
    const comma = ',';
    const precision = '\\d+';
    const tilde = '~';
    const type = '[%a-z]';

    return new RegExp(
        [
            '^',
            nonCapturingGroup(`${optionalGroup(fill)}${group(align)}`),
            optionalGroup(sign),
            optionalGroup(symbol),
            optionalGroup(zero),
            optionalGroup(width),
            optionalGroup(comma),
            nonCapturingGroup(`\\.${group(precision)}`),
            optionalGroup(tilde),
            optionalGroup(type),
            '$',
        ].join(''),
        'i'
    );
})();

const surroundedRegEx = (() => {
    const prefix = '.*?';
    const content = '.+?';
    const suffix = '.*?';
    return new RegExp(['^', group(prefix), `#\\{${group(content)}\\}`, group(suffix), '$'].join(''));
})();

function parseFormatter(formatter: string): FormatterOptions {
    let prefix: string | undefined;
    let suffix: string | undefined;
    const surrounded = formatter.match(surroundedRegEx);
    if (surrounded) {
        [, prefix, formatter, suffix] = surrounded;
    }

    const match = formatter.match(formatRegEx);
    if (!match) {
        throw new Error(`The number formatter is invalid: ${formatter}`);
    }
    const [, fill, align, sign, symbol, zero, width, comma, precision, trim, type] = match;
    return {
        fill,
        align,
        sign,
        symbol,
        zero,
        width: parseInt(width),
        comma,
        precision: parseInt(precision),
        trim: Boolean(trim),
        type,
        prefix,
        suffix,
    };
}

export function format(formatter: string | FormatterOptions) {
    const options = typeof formatter === 'string' ? parseFormatter(formatter) : formatter;
    let {
        fill,
        align,
        sign = '-',
        symbol,
        zero,
        width,
        comma,
        precision,
        trim,
        type,
        prefix = '',
        suffix = '',
    } = options;

    let formatBody: (n: number, f: number) => string;
    if (!type) {
        formatBody = decimalTypes['g'];
        trim = true;
    } else if (type in decimalTypes && type in integerTypes) {
        formatBody = isNaN(precision!) ? integerTypes[type] : decimalTypes[type];
    } else if (type in decimalTypes) {
        formatBody = decimalTypes[type];
    } else if (type in integerTypes) {
        formatBody = integerTypes[type];
    } else {
        throw new Error(`The number formatter type is invalid: ${type}`);
    }

    if (isNaN(precision!)) {
        precision = 6;
    }

    return (n: number) => {
        let result = formatBody(n, precision!);
        if (trim) {
            result = removeTrailingZeros(result);
        }
        result = addSign(n, result, sign);
        if (symbol && symbol !== '#') {
            result = `${symbol}${result}`;
        }
        if (symbol === '#' && type === 'x') {
            result = `0x${result}`;
        }
        if (comma) {
            result = insertSeparator(result, comma);
        }
        if (type === 's') {
            result = `${result}${getSIPrefix(n)}`;
        }
        if (type === '%') {
            result = `${result}%`;
        }
        result = `${prefix}${result}${suffix}`;
        if (!isNaN(width!)) {
            result = addPadding(result, width!, fill || zero, align);
        }
        return result;
    };
}

const absFloor = (n: number) => Math.floor(Math.abs(n));

const integerTypes: Record<string, (n: number) => string> = {
    b: (n) => absFloor(n).toString(2),
    c: (n) => String.fromCharCode(n),
    d: (n) => absFloor(n).toFixed(0),
    o: (n) => absFloor(n).toString(8),
    x: (n) => absFloor(n).toString(16),
    X: (n) => integerTypes.x(n).toUpperCase(),
    n: (n) => integerTypes.d(n),
    '%': (n) => `${absFloor(n * 100).toFixed(0)}`,
};

const decimalTypes: Record<string, (n: number, f: number) => string> = {
    e: (n, f) => Math.abs(n).toExponential(f),
    E: (n, f) => decimalTypes.e(n, f).toUpperCase(),
    f: (n, f) => Math.abs(n).toFixed(f),
    F: (n, f) => decimalTypes.f(n, f).toUpperCase(),
    g: (n, f) => {
        if (n === 0) {
            return '0';
        }
        const a = Math.abs(n);
        const p = Math.floor(Math.log10(a));
        if (p >= -4 && p < f) {
            return a.toFixed(f - 1 - p);
        }
        return a.toExponential(f - 1);
    },
    G: (n, f) => decimalTypes.g(n, f).toUpperCase(),
    n: (n, f) => decimalTypes.g(n, f),
    r: (n, f) => {
        if (n === 0) {
            return '0';
        }
        const a = Math.abs(n);
        const p = Math.floor(Math.log10(a));
        const q = p - (f - 1);
        if (q <= 0) {
            return a.toFixed(-q);
        }
        const x = Math.pow(10, q);
        return (Math.round(a / x) * x).toFixed();
    },
    s: (n, f) => {
        const a = Math.abs(n);
        const power = Math.log10(a);
        const p = getSIPrefixPower(n);
        return decimalTypes.f(n / Math.pow(10, p), Math.max(0, f - (Math.floor(Math.abs(power)) % 3) - 1));
    },
    '%': (n, f) => `${Math.abs(n * 100).toFixed(f)}`,
};

function removeTrailingZeros(numString: string) {
    return numString.replace(/\.0+$/, '').replace(/(\.[1-9])0+$/, '$1');
}

function insertSeparator(numString: string, separator: string) {
    let dotIndex = numString.indexOf('.');
    if (dotIndex < 0) {
        dotIndex = numString.length;
    }
    const integerChars = numString.substring(0, dotIndex).split('');
    const fractionalPart = numString.substring(dotIndex);

    for (let i = integerChars.length - 3; i > 0; i -= 3) {
        integerChars.splice(i, 0, separator);
    }
    return `${integerChars.join('')}${fractionalPart}`;
}

function getSIPrefix(n: number) {
    return siPrefixes.get(getSIPrefixPower(n));
}

function getSIPrefixPower(n: number) {
    const power = Math.log10(Math.abs(n));
    const p = Math.floor(power / 3) * 3;
    return Math.max(minSIPrefix, Math.min(maxSIPrefix, p));
}

const minSIPrefix = -24;
const maxSIPrefix = 24;
const siPrefixes = new Map<number, string>()
    .set(minSIPrefix, 'y')
    .set(-21, 'z')
    .set(-18, 'a')
    .set(-15, 'f')
    .set(-12, 'p')
    .set(-9, 'n')
    .set(-6, 'µ')
    .set(-3, 'm')
    .set(0, '')
    .set(3, 'k')
    .set(6, 'M')
    .set(9, 'G')
    .set(12, 'T')
    .set(15, 'P')
    .set(18, 'E')
    .set(21, 'Z')
    .set(maxSIPrefix, 'Y');

const minusSign = '\u2212';

function addSign(num: number, numString: string, signType = '') {
    if (signType === '(') {
        return num >= 0 ? numString : `(${numString})`;
    }
    return `${num >= 0 ? (signType === '+' ? '+' : '') : minusSign}${numString}`;
}

function addPadding(numString: string, width: number, fill = ' ', align = '>') {
    let result = numString;
    if (align === '>' || !align) {
        result = result.padStart(width, fill);
    } else if (align === '<') {
        result = result.padEnd(width, fill);
    } else if (align === '^') {
        const padWidth = Math.max(0, width - result.length);
        const padLeft = Math.ceil(padWidth / 2);
        const padRight = Math.floor(padWidth / 2);
        result = result.padStart(padLeft + result.length, fill);
        result = result.padEnd(padRight + result.length, fill);
    }
    return result;
}

export function tickFormat(
    start: number,
    stop: number,
    count: number,
    formatter?: string
): (n: number | { valueOf(): number }) => string {
    const step = tickStep(start, stop, count);
    const options = parseFormatter(formatter || ',f');
    if (isNaN(options.precision!)) {
        if (options.type === 's') {
            options.precision = step.toExponential().indexOf('e');
        } else if (!options.type || options.type in decimalTypes) {
            options.precision = 6;
        }
    }
    const f = format(options);
    return (n) => f(Number(n));
}
