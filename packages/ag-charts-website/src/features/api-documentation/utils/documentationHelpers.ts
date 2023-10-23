import type { Framework } from '@ag-grid-types';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';

import type { PropertyType } from '../types';
import { createLink } from '../utils/dom';
import { isString } from '../utils/strings';
import { getTypeLink } from './getTypeLinks';
import type { JsonModelProperty } from './model';

interface InterfaceType {
    docs?: string[];
    type: string | string[];
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

export function escapeGenericCode(lines: string[]) {
    return lines
        .join('\n')
        .replace(/\n{2,}/gm, '\n\n')
        .replace(/<([^>]*)>/g, '')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .trim();
}

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

export function getLinkedType(types: string | string[], framework: Framework) {
    if (!Array.isArray(types)) {
        types = [types];
    }

    const formattedTypes = types.filter(isString).map((type) => {
        const typesToLink = [];
        // Extract all the words to enable support for Union types
        for (const [typeName] of type.matchAll(/\w+/g)) {
            const url = getTypeUrl(typeName, framework);
            if (url) {
                typesToLink.push({ toReplace: typeName, link: createLink(url, typeName) });
            }
        }
        return typesToLink.reduce((formatted, { toReplace, link }) => formatted.split(toReplace).join(link), type);
    });

    return formattedTypes.join(' | ');
}

export function sortAndFilterProperties(properties: [string, unknown][], applyOptionalOrdering = false) {
    properties.sort(([p1], [p2]) => {
        if (applyOptionalOrdering) {
            // Push mandatory props to the top
            const isP1Optional = p1.includes('?');
            const isP2Optional = p2.includes('?');
            if (isP1Optional && !isP2Optional) return 1;
            if (!isP1Optional && isP2Optional) return -1;
            if (!isP1Optional && !isP2Optional) {
                return p1 < p2 ? -1 : 1;
            }
        }
        return 0;
    });
    return properties;
}

export function appendInterface(name: string, interfaceType: InterfaceType, framework: Framework, printConfig = {}) {
    const lines: string[] = [];
    const toExclude = printConfig.exclude || [];
    const properties = Object.entries(interfaceType.type);

    lines.push(`interface ${printConfig.hideName ? '' : name} {`);
    sortAndFilterProperties(properties, printConfig.applyOptionalOrdering)
        .filter(([prop]) => !toExclude.includes(prop))
        .forEach(([property, type]) => {
            const docs = interfaceType.docs && interfaceType.docs[property];
            if (!docs?.includes('@deprecated')) {
                if (docs) {
                    lines.push(...formatDocs(docs));
                }
                lines.push(`  ${property}: ${getLinkedType(type, framework)};`);
                if (printConfig.lineBetweenProps) {
                    lines.push('');
                }
            }
        });
    lines.push('}');
    return lines;
}

export function formatDocs(docs: string) {
    const indentReg = /\s+\*(?!\*)/g;
    const lastNewLine = /\n\s+\*\//g;

    return docs
        .replace('/**', '//')
        .replace(lastNewLine, '')
        .split(/\n/g)
        .map((s) => `  ${s.replace('*/', '').replace(indentReg, '//')}`);
}

export function removeDefaultValue(docString: string) {
    // Default may or may not be on a new line in JsDoc but in both cases we want the default to be on the next line
    return docString.replace(/(\n\s+\*)?(<br>)? Default:.*<\/code>/g, '');
}

export function getFormattedDefaultValue(defaultValue: any, description: string) {
    if (description && !defaultValue) {
        const matches = description.match(/ Default: <code>(.*)<\/code>/);
        if (matches?.length === 2) {
            defaultValue = matches[1];
        }
    }
    return Array.isArray(defaultValue) ? `[${defaultValue.map((v) => `"${v}"`).join(', ')}]` : defaultValue;
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

export function appendCallSignature(name: string, interfaceType: InterfaceType, framework: Framework) {
    const lines = [`interface ${name} {`];
    const argTypes = Object.entries(interfaceType.type.arguments).map(
        ([property, type]) => `${property}: ${getLinkedType(type, framework)}`
    );
    lines.push(`    (${argTypes.join(', ')}) : ${interfaceType.type.returnType}`);
    lines.push('}');
    return lines;
}

export function formatEnum(name: string, { type: properties, docs }: InterfaceType) {
    return [
        `enum ${name} {`,
        ...properties.flatMap((property: string, i: number) => {
            const lines = docs?.[i] ? formatDocs(docs[i]) : [];
            return lines.concat(`  ${property}`);
        }),
        '}',
    ];
}

export function appendTypeAlias(name: string, interfaceType: InterfaceType) {
    const shouldMultiLine = interfaceType.type.length > 20;

    const split = interfaceType.type.split('|');
    const smartSplit = [];

    // Don't split union types that are in the same bracket pair
    // "type": "string | string[] | ((params: HeaderClassParams) => string | string[])"
    // Should become this note we have not split the union return type onto two lines
    //   string
    // | string[]
    // | ((params: HeaderClassParams) => string | string[])
    while (split.length > 0) {
        const next = split.pop();
        const countOpen = (next.match(/\(/g) || []).length;
        const countClosed = (next.match(/\)/g) || []).length;

        if (countOpen === countClosed) {
            smartSplit.push(next);
        } else {
            const n = split.pop();
            split.push(n + '|' + next);
        }
    }

    const multiLine = shouldMultiLine ? `\n      ${smartSplit.reverse().join('\n    |')}\n` : interfaceType.type;
    return `type ${name} = ${multiLine}`;
}

export function writeAllInterfaces(
    interfacesToWrite: { name: string; interfaceType: any }[],
    framework: Framework,
    printConfig?: object
) {
    const lines: string[] = [];
    const alreadyWritten = new Set<string>();
    interfacesToWrite.forEach(({ name, interfaceType }) => {
        if (!alreadyWritten.has(name)) {
            if (interfaceType.meta.isTypeAlias) {
                lines.push(appendTypeAlias(name, interfaceType));
            } else if (interfaceType.meta.isEnum) {
                lines.push(...formatEnum(name, interfaceType));
            } else if (interfaceType.meta.isCallSignature) {
                lines.push(...appendCallSignature(name, interfaceType, framework));
            } else {
                lines.push(...appendInterface(name, interfaceType, framework, printConfig));
            }
            lines.push('');
            alreadyWritten.add(name);
        }
    });
    return lines;
}

export function extractInterfaces(definitionOrArray, interfaceLookup, overrideIncludeInterfaceFunc, allDefs = []) {
    if (!definitionOrArray) {
        return [];
    }

    if (allDefs.length > 1000) {
        // eslint-disable-next-line no-console
        console.warn('AG Charts - Possible recursion error on type: ', definitionOrArray, allDefs);
        return allDefs;
    }

    const alreadyIncluded = {};
    allDefs.forEach((v) => {
        alreadyIncluded[v.name] = true;
    });

    const addDef = (def) => {
        if (!alreadyIncluded[def.name]) {
            allDefs.push(def);
            alreadyIncluded[def.name] = true;

            return true;
        }

        return false;
    };
    const recurse = (defs, overrideFn) => {
        if (Array.isArray(defs)) {
            defs.forEach((def) => recurse(def, overrideFn));
            return;
        }

        if (typeof defs !== 'string' || alreadyIncluded[defs]) {
            return;
        }

        extractInterfaces(defs, interfaceLookup, overrideFn, allDefs).forEach(addDef);
    };

    if (Array.isArray(definitionOrArray)) {
        definitionOrArray.forEach((def) => {
            recurse(def, overrideIncludeInterfaceFunc);
        });
        return allDefs;
    }
    const definition = definitionOrArray;

    if (typeof definition == 'string') {
        const typeRegex = /\w+/g;
        const definitionTypes = [...definition.matchAll(typeRegex)];
        definitionTypes.forEach((regMatch) => {
            const type = regMatch[0];
            // If we have the actual interface use that definition
            const interfaceType = interfaceLookup[type];
            if (!interfaceType) {
                return undefined;
            }

            const isLinkedType = !!getTypeLink(type);
            const numMembers =
                typeof interfaceType.type == 'string'
                    ? interfaceType.type.split('|').length
                    : Object.entries(interfaceType.type || {}).length;

            const overrideInclusion = overrideIncludeInterfaceFunc ? overrideIncludeInterfaceFunc(type) : undefined;
            if (overrideInclusion === false) {
                // Override function is false so do not include this interface
                return undefined;
            }

            // Show interface if we have found one.
            // Do not show an interface if it has lots of properties and is a linked type.
            // Always show event interfaces
            if (
                (!isLinkedType || (isLinkedType && numMembers < 12) || overrideInclusion === true) &&
                !alreadyIncluded[type]
            ) {
                if (!addDef({ name: type, interfaceType })) {
                    // Previously added - no need to continue.
                    return;
                }

                // Now if this is a top level interface see if we should include any interfaces for its properties
                if (interfaceType.type) {
                    const interfacesToInclude: Record<string, boolean> = {};

                    if (typeof interfaceType.type === 'string') {
                        interfacesToInclude[interfaceType.type] = true;
                    } else {
                        Object.entries<string>(interfaceType.type)
                            .filter(([k, v]) => {
                                if (v && typeof v === 'string') {
                                    const docs = interfaceType.docs?.[k];
                                    return !docs || !docs.includes('@deprecated');
                                }
                                return false;
                            })
                            .map(([k, v]) => {
                                // Extract all the words from the type to handle unions and functions and params cleanly.
                                const words = [...k.matchAll(typeRegex), ...v.matchAll(typeRegex)].map((ws) => ws[0]);
                                return words.filter((w) => !getTypeLink(w) && interfaceLookup[w]);
                            })
                            .forEach((s) => {
                                s.forEach((v) => {
                                    interfacesToInclude[v] = true;
                                });
                            });
                    }

                    Object.keys(interfacesToInclude).forEach((v) => recurse(v, overrideIncludeInterfaceFunc));
                }
            }

            // If a call signature we unwrap the interface and recurse on the call signature arguments instead.
            if (interfaceType.meta.isCallSignature) {
                const args = interfaceType.type && interfaceType.type.arguments;
                Object.values(args ?? {}).forEach((v) => recurse(v, overrideIncludeInterfaceFunc));
            }
        });
        return allDefs;
    }

    Object.values(definition).forEach((v) => recurse(v, overrideIncludeInterfaceFunc));
    return allDefs;
}

export function getLongestNameLength(nameWithBreaks: string) {
    const splitNames = nameWithBreaks.split(/<br(.*)\/>/);
    splitNames.sort((a, b) => (a.length > b.length ? 1 : -1));
    return splitNames[0].length;
}

export function formatPropertyDocumentation(model: Omit<JsonModelProperty, 'desc'>): string[] {
    const documentation = model.documentation?.trim();
    const result: string[] = documentation ? [formatJsDocString(documentation)] : [];

    if (Object.hasOwn(model, 'default')) {
        result.push('Default: `' + JSON.stringify(model.default) + '`');
    }

    return result.filter((v) => v?.trim());
}
