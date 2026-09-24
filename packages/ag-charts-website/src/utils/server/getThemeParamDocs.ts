import { type ApiReferenceType, parseJsDocs } from '@components/api-documentation/apiReferenceHelpers';
import type { InterfaceNode, TypeNode } from '@generate-code-reference-plugin/doc-interfaces/types';

import { getInterfacesReference } from './getInterfacesReference';

/**
 * Per-parameter explanations for the theme builder's tooltips, taken from the
 * same JSDoc the Themes API reference publishes so the two cannot drift. The
 * generated reference is 4MB, so this runs at build time in
 * `theme-builder.astro` and the ~5KB result is handed to the island as a prop.
 */

/** Where the builder's params are declared. Interfaces it extends are followed. */
const ROOT_INTERFACE = 'AgChartThemeParams';

/**
 * Sentences saying what shape a value may take rather than what the param does.
 * They earn their place in the API reference, where the reader writes the value
 * by hand; in the builder an editor has already made that choice.
 */
const VALUE_SHAPE_SENTENCES = [
    /A colour string, or a theme-colour reference object\./,
    /A single family name, or an array of names used as fallbacks\./,
    /`true` for the default border, `false` to disable, or an object to customise it\./,
    /The value must be a valid CSS box-shadow\./,
];

/**
 * The reference renders this as markdown; a tooltip is a plain string, so the
 * backticks would show. The builder names what a param inherits in the editor.
 */
const DEFAULT_MARKER = /Default: `[^`]+`/;

export function themeParamDocs(reference: ApiReferenceType): Record<string, string> {
    const docs: Record<string, string> = {};
    for (const node of interfaceChain(reference, ROOT_INTERFACE)) {
        for (const member of node.members) {
            const text = tooltipText(parseJsDocs(member.docs));
            if (text !== '') {
                docs[member.name] = text;
            }
        }
    }
    return docs;
}

/** Build-time only: reads the generated interface reference from disk. */
export const getThemeParamDocs = () => themeParamDocs(getInterfacesReference());

/**
 * An interface and everything it extends, ancestors first - so a parameter
 * redeclared further down keeps the comment nearest to it.
 */
function interfaceChain(reference: ApiReferenceType, name: string): InterfaceNode[] {
    const node = reference.get(name);
    if (node?.kind !== 'interface') {
        return [];
    }
    const bases = (node.heritage ?? []).flatMap((base) => {
        const baseName = heritageName(base);
        return baseName == null || baseName === '' ? [] : interfaceChain(reference, baseName);
    });
    return [...bases, node];
}

const heritageName = (base: TypeNode): string | undefined => {
    if (typeof base === 'string') {
        return base;
    }
    return 'name' in base && typeof base.name === 'string' ? base.name : undefined;
};

const tooltipText = (docs: string | undefined): string => {
    let text = docs ?? '';
    for (const sentence of [...VALUE_SHAPE_SENTENCES, DEFAULT_MARKER]) {
        text = text.replace(sentence, '');
    }
    return text.replaceAll(/\s+/g, ' ').trim();
};
