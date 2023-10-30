import type { Framework } from '@ag-grid-types';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';

export const formatJson = (object) => {
    const formatters = {
        number: (x) => x,
        string: (x) => `"${x}"`,
    };

    const formatArray = (array) => {
        if (array.length) {
            const type = typeof array[0];
            const format = formatters[type];

            if (format && array.every((x) => typeof x === type)) {
                return `[${array.map(format).join(', ')}]`;
            }
        }

        return array;
    };

    const formattedJson = JSON.stringify(object, (_, v) => (Array.isArray(v) ? formatArray(v) : v), 2);

    return formattedJson
        .replace(/'/g, "\\'") // escape single quotes
        .replace(/\\"/g, '"') // unescape double quotes
        .replace(/"([^"]+)":/g, '$1:') // format property names
        .replace(/"\[/g, '[')
        .replace(/\]"/g, ']') // finish array formatting
        .replace(/"([^"]+)"/g, "'$1'"); // force single quotes
};

export const deepClone = (object) => JSON.parse(JSON.stringify(object || {}));

export function isXAxisNumeric(chartType: string) {
    return ['scatter', 'histogram'].includes(chartType);
}

export const inferType = (value: any): string | null => {
    if (value == null) {
        return null;
    }
    if (Array.isArray(value)) {
        return value.length ? `${inferType(value[0])}[]` : 'object[]';
    }
    return typeof value;
};

/**
 * Converts a subset of Markdown so that it can be used in JSON files.
 */
export const convertMarkdown = (content: string, framework: Framework) =>
    content
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            (_, text, href) => `<a href="${getExamplePageUrl({ path: href, framework })}">${text}</a>`
        )
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

export function formatJsDocString(docString: string): string {
    if (!docString) {
        return '';
    }

    const paramReg = /\* @param (\w+) (.*)\n/g;
    const returnsReg = /\* (@returns) (.*)\n/g;
    const newLineReg = /\n\s+\*(?!\*)/g;

    // Turn option list, new line starting with - into bullet points
    // eslint-disable-next-line
    const optionReg = /\n\s*[*]*\s*- (.*)/g;

    return docString
        .replace('/**', '')
        .replace('*/', '')
        .replace(paramReg, '<br> `$1` $2 \n')
        .replace(returnsReg, '<br> <strong>Returns: </strong> $2 \n')
        .replace(optionReg, '<li style="margin-left:1rem"> $1 </li>')
        .replace(newLineReg, ' ');
}
