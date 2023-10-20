import Code from '@components/Code';

import type { ObjectCode } from '../types';
import { escapeGenericCode, getLinkedType } from '../utils/documentationHelpers';
import { formatJson } from '../utils/formatJson';
import { capitalize, indent } from '../utils/strings';

export function ObjectCodeSample({ framework, id, breadcrumbs, properties }: ObjectCode) {
    const breadcrumbKeys = Object.keys(breadcrumbs ?? {});
    const lines: string[] = formatBreadcrumbs(breadcrumbKeys);

    Object.entries(properties).forEach(([key, definition]) => {
        if (key === 'meta') {
            return;
        }

        let line = indent(key, breadcrumbKeys.length);

        // process property object
        if (!definition.isRequired) {
            line += '?';
        }

        let type = getDefinitionType(definition);
        let isObject = false;

        if (!type) {
            type = capitalize(key);
            isObject = true;
        }

        line += `: ${isObject ? `<a href='#reference-${id}.${key}'>${type}</a>` : getLinkedType(type, framework)};`;

        if (definition.type && definition.default != null) {
            line += ` // default: ${formatJson(definition.default)}`;
        }

        lines.push(line);
    });

    for (let i = breadcrumbKeys.length; i > 0; i--) {
        lines.push(indent('}', i - 1));
    }

    return <Code code={escapeGenericCode(lines)} keepMarkup />;
}

function formatBreadcrumbs(breadcrumbs: string[]) {
    return breadcrumbs.flatMap((property, index) => {
        const lines = index > 0 ? [indent('...', index)] : [];
        return lines.concat(indent(`${property}: {`, index));
    });
}

function getDefinitionType(def: ObjectCode['properties'][string]) {
    if (def.meta?.type) {
        return def.meta.type;
    }
    if (def.type) {
        return typeof def.type === 'object' ? 'Function' : def.type;
    }
    if (def.options) {
        return def.options.map((option) => formatJson(option)).join(' | ');
    }
    if (def.default) {
        return Array.isArray(def.default) ? 'object[]' : typeof def.default;
    }
    if (def.description != null) {
        return 'object';
    }
}
