import { clamp } from './number';

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

export function parseFormat(format: string): FormatterOptions {
    let prefix: string | undefined;
    let suffix: string | undefined;
    const surrounded = surroundedRegEx.exec(format);
    if (surrounded) {
        [, prefix, format, suffix] = surrounded;
    }

    const match = formatRegEx.exec(format);
    if (!match) {
        throw new Error(`The number formatter is invalid: ${format}`);
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

export function numberFormat(format: string | FormatterOptions) {
    const options = typeof format === 'string' ? parseFormat(format) : format;
    const { fill, align, sign = '-', symbol, zero, width, comma, type, prefix = '', suffix = '', precision } = options;
    let { trim } = options;

    const precisionIsNaN = precision == null || isNaN(precision);
    let formatBody: (n: number, f: number) => string;
    if (!type) {
        formatBody = decimalTypes['g'];
        trim = true;
    } else if (type in decimalTypes && type in integerTypes) {
        formatBody = precisionIsNaN ? integerTypes[type] : decimalTypes[type];
    } else if (type in decimalTypes) {
        formatBody = decimalTypes[type];
    } else if (type in integerTypes) {
        formatBody = integerTypes[type];
    } else {
        throw new Error(`The number formatter type is invalid: ${type}`);
    }

    let formatterPrecision: number;
    if (precision == null || precisionIsNaN) {
        formatterPrecision = type ? 6 : 12;
    } else {
        formatterPrecision = precision;
    }

    return (n: number) => {
        let result = formatBody(n, formatterPrecision);
        if (trim) {
            result = removeTrailingZeros(result);
        }
        if (comma) {
            result = insertSeparator(result, comma);
        }
        result = addSign(n, result, sign);
        if (symbol && symbol !== '#') {
            result = `${symbol}${result}`;
        }
        if (symbol === '#' && type === 'x') {
            result = `0x${result}`;
        }
        if (type === 's') {
            result = `${result}${getSIPrefix(n)}`;
        }
        if (type === '%' || type === 'p') {
            result = `${result}%`;
        }
        if (width != null && !isNaN(width)) {
            result = addPadding(result, width, fill ?? zero, align);
        }
        result = `${prefix}${result}${suffix}`;
        return result;
    };
}

// formatRegEx structure: (fill? + align)? sign? symbol? zero? width? comma? precision? tilde? type?
const formatRegEx = /^(?:(.)?([<>=^]))?([+\-( ])?([$€£¥₣₹#])?(0)?(\d+)?(,)?(?:\.(\d+))?(~)?([%a-z])?$/i;
const surroundedRegEx = /^((?:[^#]|#[^{])*)#{([^}]+)}(.*)$/;

const integerTypes: Record<string, (n: number) => string> = {
    b: (n) => absFloor(n).toString(2),
    c: (n) => String.fromCharCode(n),
    d: (n) => Math.round(Math.abs(n)).toFixed(0),
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
    p: (n, f) => decimalTypes.r(n * 100, f),
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
        const x = 10 ** q;
        return (Math.round(a / x) * x).toFixed();
    },
    s: (n, f) => {
        const p = getSIPrefixPower(n);
        return decimalTypes.r(n / 10 ** p, f);
    },
    '%': (n, f) => decimalTypes.f(n * 100, f),
};

const minSIPrefix = -24;
const maxSIPrefix = 24;
const siPrefixes: Record<number, string> = {
    [minSIPrefix]: 'y',
    [-21]: 'z',
    [-18]: 'a',
    [-15]: 'f',
    [-12]: 'p',
    [-9]: 'n',
    [-6]: 'µ',
    [-3]: 'm',
    [0]: '',
    [3]: 'k',
    [6]: 'M',
    [9]: 'G',
    [12]: 'T',
    [15]: 'P',
    [18]: 'E',
    [21]: 'Z',
    [maxSIPrefix]: 'Y',
};

const minusSign = '\u2212';

function absFloor(n: number) {
    return Math.floor(Math.abs(n));
}

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
    return siPrefixes[getSIPrefixPower(n)];
}

function getSIPrefixPower(n: number) {
    return clamp(minSIPrefix, n ? Math.floor(Math.log10(Math.abs(n)) / 3) * 3 : 0, maxSIPrefix);
}

function addSign(num: number, numString: string, signType = '') {
    if (signType === '(') {
        return num >= 0 ? numString : `(${numString})`;
    }
    const plusSign = signType === '+' ? '+' : '';
    return `${num >= 0 ? plusSign : minusSign}${numString}`;
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
