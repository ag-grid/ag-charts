import type { TextOrSegments } from 'ag-charts-types';

import { isArray, isString } from './typeGuards';
import { toTextString } from './textUtils';

/**
 * Joins an array of strings or objects into a formatted string, adding a custom conjunction before the last item.
 * Useful for creating human-readable lists from arrays with an option to limit the number of items shown.
 * @param values An array of strings or objects to join. Objects are converted to strings using the `format` function.
 * @param conjunction The word to use before the last item in the list, defaulting to 'and'.
 * @param format A function that formats each item in the array. By default, items are converted to strings using `String`.
 * @param maxItems The maximum number of items to show before truncating, defaults to showing all items.
 * @returns A string that is the result of joining the formatted values with commas, truncating if necessary, and appending the specified conjunction before the last item.
 */
export function joinFormatted(
    values: string[],
    conjunction: string = 'and',
    format: (value: any) => string = String,
    maxItems = Infinity
): string {
    if (values.length === 0) {
        return '';
    } else if (values.length === 1) {
        return format(values[0]);
    }
    values = values.map(format);
    const lastValue = values.pop();
    if (values.length >= maxItems) {
        const remainingCount = values.length - (maxItems - 1);
        return `${values.slice(0, maxItems - 1).join(', ')}, and ${remainingCount} more ${conjunction} ${lastValue}`;
    }
    return `${values.join(', ')} ${conjunction} ${lastValue}`;
}

/**
 * Converts a value to a string with an optional maximum length.
 * Provides specific string representations for `undefined`, `NaN`, `Infinity`, and `-Infinity`.
 * If the stringified value exceeds the specified maximum length, it truncates the string and appends an indication of the truncated length.
 * @param value The value to be stringified. Can be of any type.
 * @param maxLength The maximum length of the resulting string. Defaults to Infinity.
 * @returns A string representation of the value, potentially truncated if it exceeds the maximum length.
 */
export function stringifyValue(value: unknown, maxLength = Infinity): string {
    if (typeof value === 'number') {
        if (Number.isNaN(value)) {
            return 'NaN';
        } else if (value === Infinity) {
            return 'Infinity';
        } else if (value === -Infinity) {
            return '-Infinity';
        }
    }
    // If values is not serializable output value type instead.
    const strValue = JSON.stringify(value) ?? typeof value;
    if (strValue.length > maxLength) {
        return `${strValue.slice(0, maxLength)}... (+${strValue.length - maxLength} characters)`;
    }
    return strValue;
}

/**
 * Efficiently counts the number of lines in a string.
 * Processes the string in a single pass, counting newline (`\n`) characters
 * by their ASCII value (10). Optimized for performance in scenarios with
 * large datasets or tight loops.
 * @param {string} text The input string.
 * @returns {number} The number of lines, with at least one line for non-empty strings.
 */
export function countLines(text: string): number {
    let count = 1;
    for (let i = 0; i < text.length; i++) {
        if (text.codePointAt(i) === 10) {
            count++;
        }
    }
    return count;
}

/**
 * Computes the Levenshtein distance between two strings.
 * This function uses a space-optimized dynamic programming approach.
 *
 * @param {string} a - The first string.
 * @param {string} b - The second string.
 * @returns {number} - The Levenshtein distance between the two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
    if (a === b) return 0; // Early return

    const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
    const m = shorter.length;
    const n = longer.length;

    let prevRow = new Array(m + 1).fill(0).map((_, i) => i);
    let currRow = new Array(m + 1);

    for (let i = 1; i <= n; i++) {
        currRow[0] = i;
        for (let j = 1; j <= m; j++) {
            const cost = longer[i - 1] === shorter[j - 1] ? 0 : 1;
            currRow[j] = Math.min(
                prevRow[j] + 1, // Deletion
                currRow[j - 1] + 1, // Insertion
                prevRow[j - 1] + cost // Substitution
            );
        }
        [prevRow, currRow] = [currRow, prevRow]; // Swap rows
    }

    return prevRow[m];
}

/**
 * Converts a string into kebab-case. It lowercases each matched uppercase character in the same single iteration
 * through the string.
 *
 * @param {string} a - The string.
 * @returns {string} - The kebab-case string.
 */
export function kebabCase(a: string) {
    // Lowercase all matches and add a `-` if the match is a standalone uppercase character (not the 0th offset).
    return a.replaceAll(KEBAB_CASE_REGEX, (match, offset) => (offset > 0 ? '-' : '') + match.toLowerCase());
}

// Find sequences of uppercase characters that are not followed by a lowercase character OR standalone uppercase
// characters.
const KEBAB_CASE_REGEX = /[A-Z]+(?![a-z])|[A-Z]/g;

export function toPlainText(text?: TextOrSegments, fallback = ''): string {
    if (text == null) {
        return fallback;
    } else if (isArray(text)) {
        return text.map((segment) => toTextString(segment.text)).join('');
    } else if (isString(text)) {
        return text;
    } else {
        return String(text);
    }
}
