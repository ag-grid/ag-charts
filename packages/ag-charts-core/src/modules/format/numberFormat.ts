import { Logger } from '../../globals';
import { clamp } from '../../utils/numbers';
import { isString } from '../../utils/typeGuards';

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

// formatRegEx structure: (fill? + align)? sign? symbol? zero? width? comma? precision? tilde? type?
const formatRegEx = /^(?:(.)?([<>=^]))?([+\-( ])?([$€£¥₣₹#])?(0)?(\d+)?(,)?(?:\.(\d+))?(~)?([%a-z])?$/i;
const surroundedRegEx = /^((?:[^#]|#[^{])*)#{([^}]+)}(.*)$/;

export function isValidNumberFormat(value: unknown): boolean {
    if (!isString(value)) return false;
    const match = surroundedRegEx.exec(value);
    return formatRegEx.test(match ? match[2] : value);
}

export function parseNumberFormat(format: string): FormatterOptions | undefined {
    let prefix: string | undefined;
    let suffix: string | undefined;
    const surrounded = surroundedRegEx.exec(format);
    if (surrounded) {
        [, prefix, format, suffix] = surrounded;
    }

    const match = formatRegEx.exec(format);
    if (!match) {
        Logger.warnOnce(`The number formatter is invalid: ${format}`);
        return;
    }

    const [, fill, align, sign, symbol, zero, width, comma, precision, trim, type] = match;
    return {
        fill,
        align,
        sign,
        symbol,
        zero,
        width: Number.parseInt(width),
        comma,
        precision: Number.parseInt(precision),
        trim: Boolean(trim),
        type,
        prefix,
        suffix,
    };
}

export function createNumberFormatter(format: FormatterOptions): (n: number, fractionDigits?: number) => string;
export function createNumberFormatter(format: string): ((n: number, fractionDigits?: number) => string) | undefined;
export function createNumberFormatter(format: string | FormatterOptions) {
    const options = typeof format === 'string' ? parseNumberFormat(format) : format;
    if (options == null) return;
    const { fill, align, sign = '-', symbol, zero, width, comma, type, prefix = '', suffix = '', precision } = options;
    let { trim } = options;

    const precisionIsNaN = precision == null || Number.isNaN(precision);
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

    const defaultFormatterPrecision = type ? 6 : 12;
    let formatterPrecision: number | undefined;
    if (!precisionIsNaN) {
        formatterPrecision = precision;
    }

    let padAlign = align;
    let padFill = fill;
    if (zero) {
        padFill ??= '0';
        padAlign ??= '=';
    }

    return (n: number, fractionDigits?: number) => {
        // When a format type is specified and no precision is in the format string:
        // - For 'f' and '%' types, fractionDigits can be used (it represents decimal places)
        // - For other types (s, r, g, e, etc.), use default precision (fractionDigits represents tick step, not format precision)
        // - When no type is specified, fractionDigits can be used as a fallback
        let effectivePrecision: number;
        if (formatterPrecision != null) {
            effectivePrecision = formatterPrecision;
        } else if (type === 'f' || type === '%') {
            effectivePrecision = fractionDigits ?? defaultFormatterPrecision;
        } else if (type) {
            effectivePrecision = defaultFormatterPrecision;
        } else {
            effectivePrecision = fractionDigits ?? defaultFormatterPrecision;
        }
        let result = formatBody(n, effectivePrecision);
        if (trim) {
            result = removeTrailingZeros(result);
        }
        if (comma) {
            result = insertSeparator(result, comma);
        }

        const symbolPrefix = getSymbolPrefix(symbol, type);
        const symbolPrefixLength = symbolPrefix?.length ?? 0;
        if (symbolPrefix) {
            result = `${symbolPrefix}${result}`;
        }

        if (type === 's') {
            result = `${result}${getSIPrefix(n)}`;
        }
        if (type === '%' || type === 'p') {
            result = `${result}%`;
        }
        const { value: signedResult, prefixLength: signPrefixLength } = addSign(n, result, sign);
        const totalPrefixLength = signPrefixLength + symbolPrefixLength;
        let output = signedResult;
        if (width != null && !Number.isNaN(width)) {
            output = addPadding(output, width, padFill ?? ' ', padAlign, totalPrefixLength);
        }
        output = `${prefix}${output}${suffix}`;
        return output;
    };
}

const integerTypes: Record<string, (n: number) => string> = {
    b: (n) => absFloor(n).toString(2),
    c: (n) => String.fromCodePoint(n),
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
    if (!numString.endsWith('0') || !numString.includes('.')) return numString;

    let endIndex = numString.length - 1;
    while (endIndex > 0) {
        if (numString[endIndex] == '0') {
            endIndex -= 1;
        } else if (numString[endIndex] == '.') {
            endIndex -= 1;
            break;
        } else {
            break;
        }
    }

    return numString.substring(0, endIndex + 1);
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

function addSign(num: number, numString: string, signType = ''): { value: string; prefixLength: number } {
    if (signType === '(') {
        if (num >= 0) {
            return { value: numString, prefixLength: 0 };
        }
        return { value: `(${numString})`, prefixLength: 1 };
    }

    let signPrefix = '';
    if (num < 0) {
        signPrefix = minusSign;
    } else if (signType === '+') {
        signPrefix = '+';
    } else if (signType === ' ') {
        signPrefix = ' ';
    }

    return { value: `${signPrefix}${numString}`, prefixLength: signPrefix.length };
}

function addPadding(numString: string, width: number, fill = ' ', align = '>', prefixLength = 0) {
    const padSize = width - numString.length;
    if (padSize <= 0) {
        return numString;
    }
    const padding = fill.repeat(padSize);

    if (align === '=') {
        const clampedPrefix = Math.min(Math.max(prefixLength, 0), numString.length);
        const start = numString.slice(0, clampedPrefix);
        const rest = numString.slice(clampedPrefix);
        return `${start}${padding}${rest}`;
    }

    if (align === '>' || !align) {
        return padding + numString;
    } else if (align === '<') {
        return `${numString}${padding}`;
    } else if (align === '^') {
        const padLeft = Math.ceil(padSize / 2);
        const padRight = Math.floor(padSize / 2);
        return `${fill.repeat(padLeft)}${numString}${fill.repeat(padRight)}`;
    }
    return padding + numString;
}

function getSymbolPrefix(symbol: string | undefined, type: string | undefined) {
    if (symbol === '#') {
        switch (type) {
            case 'b':
                return '0b';
            case 'o':
                return '0o';
            case 'x':
                return '0x';
            case 'X':
                return '0X';
            default:
                return '';
        }
    }
    return symbol ?? '';
}
