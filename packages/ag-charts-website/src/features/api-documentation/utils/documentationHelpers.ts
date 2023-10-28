import type { Framework } from '@ag-grid-types';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';

import type { PropertyType } from '../types';
import { getTypeLink } from './getTypeLinks';

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

export function getTypeUrl(type: string | PropertyType, framework: Framework): string | null {
    if (typeof type === 'string') {
        if (type.includes('|')) {
            const linkedTypes = type
                .split('|')
                .map((t) => getTypeUrl(t.trim(), framework))
                .filter(Boolean);
            // If there is only one linked type then lets return that otherwise we don't support union type links
            if (linkedTypes.length === 1) {
                return linkedTypes[0];
            }

            return null;
        } else if (type.endsWith('[]')) {
            type = type.replace(/\[\]/g, '');
        }
    } else if (typeof type === 'object' && typeof type.returnType === 'string') {
        // This method can be called with a type object
        return getTypeUrl(type.returnType, framework);
    }
    const link = getTypeLink(type);

    return link ? getExamplePageUrl({ path: link, framework }) : null;
}

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
