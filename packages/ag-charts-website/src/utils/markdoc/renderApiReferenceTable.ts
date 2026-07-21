import { markdownTable } from '@ag-website-shared/markdoc/markdownTable';
import type { MarkdownFramework } from '@ag-website-shared/markdoc/renderMarkdocToMarkdown';
import {
    cleanupName,
    normalizeType,
    parseJsDocs,
    processMembers,
} from '@components/api-documentation/apiReferenceHelpers';
import type { ApiReferenceConfig } from '@components/api-documentation/components/ApiReference';
import { getInterfacesReference } from '@utils/server/getInterfacesReference';

/** Read a Markdoc attribute as a list of member names, ignoring non-string entries. */
function asNameList(value: unknown): string[] | undefined {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : undefined;
}

/**
 * Builds the Markdown table for an `apiReference` interface, mirroring the on-page React
 * component's member pipeline (same `processMembers`/`normalizeType`/`parseJsDocs`) so the
 * table stays in step with the rendered docs.
 *
 * Never throws: a build without generated types (missing resolved-interfaces file) or an
 * unresolvable interface degrades to an empty string so the surrounding page still renders.
 */
function buildApiReferenceTable(attributes: Record<string, unknown>): string {
    const id = typeof attributes.id === 'string' ? attributes.id : undefined;
    if (!id) {
        return '';
    }

    try {
        const interfaceRef = getInterfacesReference().get(id);
        if (interfaceRef?.kind !== 'interface') {
            return '';
        }

        const config: ApiReferenceConfig = {
            include: asNameList(attributes.include),
            exclude: asNameList(attributes.exclude),
            prioritise: asNameList(attributes.prioritise),
        };

        const hideRequired = attributes.hideRequired === true;
        // markdownTable's cell escaping already collapses newlines and escapes pipes, so the
        // markdown from parseJsDocs can be passed through as-is.
        const rows = processMembers(interfaceRef, config).map((member) => {
            const required = !hideRequired && !member.optional ? ' (required)' : '';
            return [cleanupName(member.name) + required, normalizeType(member.type), parseJsDocs(member.docs) ?? ''];
        });

        if (!rows.length) {
            return '';
        }

        return markdownTable(['Property', 'Type', 'Description'], rows);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Unable to render apiReference table for "${id}":`, error);
        return '';
    }
}

/**
 * Renders an `apiReference` Markdoc tag as a GitHub-flavoured Markdown table for the
 * LLM-facing docs. The table is framework-agnostic — the member set and its types are
 * identical across frameworks — so `framework` is accepted for contract parity only.
 */
export function renderApiReferenceTable(params: {
    attributes: Record<string, unknown>;
    framework: MarkdownFramework;
}): Promise<string> {
    return Promise.resolve(buildApiReferenceTable(params.attributes));
}
