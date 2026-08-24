import { markdownTable } from '@ag-website-shared/markdoc/markdownTable';
import type { MarkdownFramework } from '@ag-website-shared/markdoc/renderMarkdocToMarkdown';
import {
    type ApiReferenceType,
    buildTypeArguments,
    cleanupName,
    getMemberType,
    isArrayNode,
    normalizeType,
    parseJsDocs,
    processMembers,
    resolveAliasedUnion,
    resolveReferenceType,
} from '@components/api-documentation/apiReferenceHelpers';
import type { ApiReferenceConfig } from '@components/api-documentation/components/ApiReference';
import type {
    InterfaceNode,
    MemberNode,
    NodeTypes,
    TypeLiteralNode,
} from '@generate-code-reference-plugin/doc-interfaces/types';
import { getInterfacesReference } from '@utils/server/getInterfacesReference';

// The deepest real nesting in the generated reference is 5 levels and the widest table 579 rows.
// These caps only stop a cycle the ancestor guard misses from producing an unbounded table.
const MAX_DEPTH = 8;
const MAX_ROWS = 1500;

export interface ApiReferenceTableLimits {
    /**
     * Stop expanding nested members below this depth. Set it where the reference branches
     * combinatorially — `AgChartTheme.overrides` repeats the whole chart tree once per chart type,
     * so a full expansion runs to tens of thousands of rows — and say so on the page, since a
     * caller-set depth truncates silently.
     */
    maxDepth?: number;
    /** Stop after this many rows. Raise alongside a `maxDepth` wide enough to exceed the default. */
    maxRows?: number;
}

// A union alias with dozens of variants (e.g. AgIconName, 53 string literals) makes an unreadable
// cell; past this budget the alias name is left in place, still resolvable from the docs site.
const MAX_UNION_SIGNATURE_CHARS = 120;

/** Read a Markdoc attribute as a list of member names, ignoring non-string entries. */
function asNameList(value: unknown): string[] | undefined {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : undefined;
}

function interfaceId(attributes: Record<string, unknown>): string | undefined {
    return typeof attributes.id === 'string' ? attributes.id : undefined;
}

function isMembersNode(node: NodeTypes): node is InterfaceNode | TypeLiteralNode {
    return node.kind === 'interface' || node.kind === 'typeLiteral';
}

/**
 * The interface a member expands into, mirroring the `hasMembers` branch of ApiReference's
 * NodeFactory. Union variants — which the on-page tree expands behind "See available interfaces" —
 * resolve to a type alias here and so stay flat; expanding them as rows is combinatorial.
 */
function resolveNestedInterface(reference: ApiReferenceType, member: MemberNode) {
    const typeName = getMemberType(member);
    const resolved = resolveReferenceType(reference, typeName);
    if (!resolved || Array.isArray(resolved) || !isMembersNode(resolved) || !resolved.members.length) {
        return undefined;
    }
    return { node: resolved, typeName };
}

/**
 * The Type cell for a member. A member typed as a union alias renders as the bare alias name,
 * which tells the reader nothing; expand it to the union itself so the variants survive in a
 * surface that has no "See available interfaces" affordance.
 */
function formatMemberType(reference: ApiReferenceType, member: MemberNode): string {
    const type = normalizeType(member.type);
    const typeName = getMemberType(member);
    // Anything that did not collapse to the bare name already spells out its members.
    if (type !== typeName && type !== `${typeName}[]`) {
        return type;
    }

    const resolved = resolveReferenceType(reference, typeName);
    const aliasedUnion = resolveAliasedUnion(resolved && !Array.isArray(resolved) ? resolved : undefined, reference);
    if (!aliasedUnion) {
        return type;
    }

    const signature = normalizeType(aliasedUnion.unionType);
    if (signature.length > MAX_UNION_SIGNATURE_CHARS) {
        return type;
    }
    // Array<> rather than [] for the same reason normalizeType uses it: `A | B[]` would misread.
    return isArrayNode(member.type) ? `Array<${signature}>` : signature;
}

/**
 * Builds the Markdown table for an `apiReference` interface, mirroring the on-page React
 * component's member pipeline (same `processMembers`/`normalizeType`/`parseJsDocs`) so the
 * table stays in step with the rendered docs.
 *
 * Nested object members are expanded in place as dotted-path rows (`selection.enabled`), since a
 * static page has no equivalent of the on-page "See child properties" toggle.
 *
 * Pure (no filesystem access) so it is unit-testable; the entry point loads the reference.
 */
export function buildApiReferenceTable(
    reference: ApiReferenceType,
    attributes: Record<string, unknown>,
    limits: ApiReferenceTableLimits = {}
): string {
    const maxDepth = limits.maxDepth ?? MAX_DEPTH;
    const maxRows = limits.maxRows ?? MAX_ROWS;
    const id = interfaceId(attributes);
    if (!id) {
        return '';
    }

    const interfaceRef = reference.get(id);
    if (interfaceRef?.kind !== 'interface') {
        return '';
    }

    const config: ApiReferenceConfig = {
        include: asNameList(attributes.include),
        exclude: asNameList(attributes.exclude),
        prioritise: asNameList(attributes.prioritise),
    };
    // include/exclude/prioritise scope the top-level interface only; nested interfaces must render
    // their full member set, matching ApiReference's nestedConfig.
    const nestedConfig: ApiReferenceConfig = {
        ...config,
        include: undefined,
        exclude: undefined,
        prioritise: undefined,
    };

    const hideRequired = attributes.hideRequired === true;
    const rows: string[][] = [];
    let depthCapped = false;
    let rowsCapped = false;

    function collectRows(
        node: InterfaceNode | TypeLiteralNode,
        memberConfig: ApiReferenceConfig,
        prefix: string,
        depth: number,
        // A single pre-order pass needs a cycle guard the on-page tree does not; track it per
        // branch so a type shared between two parents still expands under each.
        ancestors: ReadonlySet<string>,
        typeArguments?: string[]
    ): void {
        for (const member of processMembers(node, memberConfig, typeArguments)) {
            if (rows.length >= maxRows) {
                rowsCapped = true;
                return;
            }

            const path = prefix ? `${prefix}.${cleanupName(member.name)}` : cleanupName(member.name);
            const required = !hideRequired && !member.optional ? ' (required)' : '';
            // markdownTable's cell escaping collapses newlines and escapes pipes, so the markdown
            // from parseJsDocs can be passed through as-is.
            rows.push([
                path + required,
                formatMemberType(reference, member),
                member.defaultValue ?? '',
                parseJsDocs(member.docs) ?? '',
            ]);

            const nested = resolveNestedInterface(reference, member);
            if (!nested || ancestors.has(nested.typeName)) {
                continue;
            }
            if (depth >= maxDepth) {
                depthCapped = true;
                continue;
            }

            collectRows(
                nested.node,
                nestedConfig,
                path,
                depth + 1,
                new Set(ancestors).add(nested.typeName),
                // Resolve the member's own typeRef through the declaring node's generics map, as
                // in NodeFactory.
                buildTypeArguments(member, node.kind === 'interface' ? node.genericsMap : undefined)
            );
        }
    }

    collectRows(interfaceRef, config, '', 1, new Set([id]));

    // A caller-set depth is a deliberate policy the page states for itself, so only the default
    // guard warns. The row cap is always a runaway backstop.
    if (rowsCapped || (depthCapped && limits.maxDepth == null)) {
        // eslint-disable-next-line no-console
        console.warn(
            `apiReference "${id}": nested expansion hit the ${maxRows}-row/${maxDepth}-level cap; table truncated.`
        );
    }

    return markdownTable(['Property', 'Type', 'Default', 'Description'], rows);
}

/**
 * Renders an `apiReference` Markdoc tag as a GitHub-flavoured Markdown table for the
 * LLM-facing docs. The table is framework-agnostic — the member set and its types are
 * identical across frameworks — so `framework` is accepted for contract parity only.
 *
 * Never throws: a build without generated types (missing resolved-interfaces file) or an
 * unresolvable interface degrades to an empty string so the surrounding page still renders.
 */
export function renderApiReferenceTable(params: {
    attributes: Record<string, unknown>;
    framework: MarkdownFramework;
}): Promise<string> {
    try {
        return Promise.resolve(buildApiReferenceTable(getInterfacesReference(), params.attributes));
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Unable to render apiReference table for "${interfaceId(params.attributes)}":`, error);
        return Promise.resolve('');
    }
}
