import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Mirrors `TypeNode` in the code-reference generator's `doc-interfaces/types.ts`, which declares the shape of
 * the JSON read below. It is restated rather than imported because that file sits outside this library's
 * `rootDir`, and tsc refuses to pull a source file across that boundary even for a type.
 */
export type TypeNode =
    | string
    | { kind: 'union' | 'intersection' | 'tuple'; type: TypeNode[] }
    | { kind: 'array'; type: TypeNode }
    | { kind: 'typeRef'; type: string; typeArguments?: TypeNode[] }
    | { kind: 'typeLiteral' | 'interface' | 'typeAlias' | 'enum' | 'function' | 'indexAccess' };

interface MemberNode {
    kind: string;
    name: string;
    type: TypeNode;
    optional?: boolean;
}

interface TypeParameterNode {
    name: string;
    default?: TypeNode;
}

/**
 * One entry of the contract map. The generator splits these into `InterfaceNode | TypeAliasNode`, which would
 * need narrowing at every access here, so the members both shapes carry are widened into one lenient view.
 */
interface ContractEntry {
    kind: string;
    name: string;
    type?: TypeNode;
    heritage?: TypeNode[];
    members?: MemberNode[];
    typeParams?: TypeParameterNode[];
    genericsMap?: Record<string, TypeNode>;
}

type Contract = Record<string, ContractEntry>;

export interface ThemeablePath {
    path: Array<string>;
    /** The structural type: generic arguments substituted and aliases unwrapped, all the way down. */
    type: TypeNode;
    /**
     * The alias names unwrapped to reach `type`, outermost first. `Opacity` and `PixelSize` both bottom out at
     * `number`, so the name is the only thing carrying the legal range.
     */
    aliases: Array<string>;
    /** Set when the declared type is a name the contract does not define, so the subtree could not be walked. */
    unresolved?: string;
}

const WORKSPACE_MARKER = 'nx.json';
const CONTRACT_RELATIVE_PATH = join('dist', 'packages', 'ag-charts-types', 'resolved-interfaces.AUTO.json');

/** Nested option interfaces bottom out well within this; the limit only guards pathological self-reference. */
const MAX_DEPTH = 5;

/** Aliases and type parameters can chain; the limit only guards a self-referential declaration. */
const MAX_TYPE_RESOLUTION_STEPS = 8;

/** Union branches and array elements nest shallowly; the limit only guards a self-referential expression. */
const MAX_EXPRESSION_DEPTH = 5;

let contractCache: Contract | undefined;

/**
 * Anchored on the workspace marker rather than a bounded parent walk, so the contract resolves to the same
 * file whichever package directory a runner starts in, and a lookup from outside the workspace fails loudly.
 */
function findWorkspaceRoot() {
    let dir = process.cwd();
    while (!existsSync(join(dir, WORKSPACE_MARKER))) {
        const parent = dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
    return dir;
}

export function loadThemeableContract(): Contract {
    if (contractCache) return contractCache;

    const workspaceRoot = findWorkspaceRoot();
    if (workspaceRoot == null) {
        throw new Error(`No workspace root (${WORKSPACE_MARKER}) above ${process.cwd()}.`);
    }

    const contractPath = join(workspaceRoot, CONTRACT_RELATIVE_PATH);
    if (!existsSync(contractPath)) {
        throw new Error(
            `Themeable options contract not found at ${contractPath}. ` +
                `Run \`nx docs-resolved-interfaces ag-charts-types\`.`
        );
    }

    contractCache = JSON.parse(readFileSync(contractPath, 'utf8')) as Contract;
    return contractCache;
}

function typeName(type: unknown): string | undefined {
    if (typeof type === 'string') return type;
    if (type != null && typeof type === 'object') {
        const node = type as { kind?: string; type?: unknown };
        if (node.kind === 'typeRef' && typeof node.type === 'string') return node.type;
    }
    return undefined;
}

/** The generic arguments in force while walking one interface, keyed by the type-parameter name. */
type Bindings = ReadonlyMap<string, TypeNode>;

/** Where a type reference was written: the declaring interface plus the generic arguments it was given. */
interface Scope {
    entry: ContractEntry;
    bindings: Bindings;
}

/**
 * Substitutes generic arguments and unwraps aliases so callers see the structural type. Arguments supplied
 * at the reference site win over the parameter defaults in `genericsMap`, which is how `highlight`-style
 * members reach a concrete style interface instead of stalling on the parameter name. `genericsMap` maps a
 * parameter to itself on most interfaces, so the declared `typeParams` default is consulted last — without
 * it every `TContext` member would read as a type the contract does not declare.
 */
function resolveType(contract: Contract, type: TypeNode, scope: Scope, aliases?: Array<string>): TypeNode {
    let current = type;
    for (let step = 0; step < MAX_TYPE_RESOLUTION_STEPS; step++) {
        const name = typeName(current);
        if (name == null) return current;
        if (contract[name]?.kind === 'typeAlias') aliases?.push(name);

        // A source mapping the parameter to itself carries no information, so the next one is tried.
        const substitution = [
            scope.bindings.get(name),
            scope.entry.genericsMap?.[name],
            scope.entry.typeParams?.find((param) => param.name === name)?.default,
        ].find((candidate) => candidate != null && typeName(candidate) !== name);
        if (substitution != null) {
            current = substitution;
            continue;
        }

        const entry = contract[name];
        if (entry?.kind === 'typeAlias' && entry.type != null) {
            current = entry.type;
            continue;
        }

        return current;
    }
    return current;
}

/**
 * `resolveType` for a whole type expression: union branches and array elements are resolved too, so a
 * caller reading the node sees the literals and primitives rather than the alias names wrapping them.
 */
function deepResolveType(contract: Contract, type: TypeNode, scope: Scope, depth = 0): TypeNode {
    const resolved = resolveType(contract, type, scope);
    if (depth >= MAX_EXPRESSION_DEPTH || typeof resolved !== 'object') return resolved;

    if (resolved.kind === 'union' || resolved.kind === 'intersection' || resolved.kind === 'tuple') {
        return {
            ...resolved,
            type: resolved.type.map((branch) => deepResolveType(contract, branch, scope, depth + 1)),
        };
    }
    if (resolved.kind === 'array') {
        return { ...resolved, type: deepResolveType(contract, resolved.type, scope, depth + 1) };
    }
    return resolved;
}

/** Binds `target`'s type parameters to the arguments written at the reference site, resolved in `scope`. */
function bindTypeArguments(contract: Contract, target: ContractEntry, type: TypeNode, scope: Scope): Bindings {
    const typeArguments = typeof type === 'object' && type.kind === 'typeRef' ? type.typeArguments : undefined;
    const bindings = new Map<string, TypeNode>();
    for (const [index, param] of (target.typeParams ?? []).entries()) {
        const argument = typeArguments?.[index];
        if (argument == null) continue;
        bindings.set(param.name, resolveType(contract, argument, scope));
    }
    return bindings;
}

function omittedKeys(contract: Contract, keys: unknown, scope: Scope): Set<string> {
    const literals = new Set<string>();
    const collect = (node: unknown) => {
        const resolved = resolveType(contract, node as TypeNode, scope);
        if (typeof resolved === 'string') {
            for (const part of resolved.split('|')) {
                literals.add(part.trim().replace(/(?:^')|(?:'$)/g, ''));
            }
        } else if (resolved != null && typeof resolved === 'object') {
            const union = resolved as { type?: unknown };
            if (Array.isArray(union.type)) {
                for (const branch of union.type) collect(branch);
            }
        }
    };
    collect(keys);
    return literals;
}

/** Type names the contract does not declare because they are language built-ins. */
const BUILTIN_TYPE_NAMES = new Set([
    'any',
    'bigint',
    'boolean',
    'Date',
    'never',
    'null',
    'number',
    'object',
    'string',
    'symbol',
    'undefined',
    'unknown',
    'void',
]);

interface ExpandState {
    contract: Contract;
    out: Array<ThemeablePath>;
    /** Emitted path keys, so a member reachable through several heritage chains is enumerated once. */
    emitted: Set<string>;
}

function expand(
    state: ExpandState,
    scope: Scope,
    prefix: Array<string>,
    depth: number,
    seen: Set<string>,
    omit: Set<string>
) {
    const { contract } = state;
    const { entry } = scope;

    // Own members before inherited ones: the first declaration of a path wins the `emitted` dedup, and a
    // redeclaration in a derived interface is the authoritative type.
    for (const member of entry.members ?? []) {
        // Undocumented internals (`_enabledFromTheme`) are exercised explicitly, not enumerated.
        if (member.kind !== 'member' || omit.has(member.name) || member.name.startsWith('_')) continue;

        const path = [...prefix, member.name];
        const aliases: Array<string> = [];
        const resolved = resolveType(contract, member.type, scope, aliases);
        const resolvedName = typeName(resolved);
        const nested = contract[resolvedName ?? ''];

        if (nested?.kind === 'interface' && depth < MAX_DEPTH && !seen.has(nested.name)) {
            const nestedScope = { entry: nested, bindings: bindTypeArguments(contract, nested, resolved, scope) };
            expand(state, nestedScope, path, depth + 1, new Set(seen).add(nested.name), new Set());
            continue;
        }

        const key = path.join('.');
        if (state.emitted.has(key)) continue;
        state.emitted.add(key);

        // A name the contract does not declare is a subtree the harness cannot see into. Naming it keeps
        // the loss visible to callers, rather than folding it in with types that merely have no candidate.
        const unresolved =
            resolvedName != null && nested == null && !BUILTIN_TYPE_NAMES.has(resolvedName) ? resolvedName : undefined;
        state.out.push({
            path,
            type: deepResolveType(contract, resolved, scope),
            aliases,
            ...(unresolved != null && { unresolved }),
        });
    }

    for (const heritage of entry.heritage ?? []) {
        const name = typeName(heritage);
        if (name === 'Omit') {
            const [target, keys] = (heritage as { typeArguments?: unknown[] }).typeArguments ?? [];
            const targetEntry = contract[typeName(target) ?? ''];
            if (targetEntry && !seen.has(targetEntry.name)) {
                const targetScope = {
                    entry: targetEntry,
                    bindings: bindTypeArguments(contract, targetEntry, target as TypeNode, scope),
                };
                const nextSeen = new Set(seen).add(targetEntry.name);
                expand(state, targetScope, prefix, depth, nextSeen, omittedKeys(contract, keys, scope));
            }
            continue;
        }

        const base = contract[name ?? ''];
        if (base && !seen.has(base.name)) {
            const baseScope = {
                entry: base,
                bindings: bindTypeArguments(contract, base, heritage, scope),
            };
            expand(state, baseScope, prefix, depth, new Set(seen).add(base.name), omit);
        }
    }
}

export function themeableInterfaceName(seriesType: string) {
    const pascalCase = seriesType
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
    return `Ag${pascalCase}SeriesThemeableOptions`;
}

/** Every themeable leaf option declared for a series type, as declared by `ag-charts-types`. */
export function themeablePaths(seriesType: string): Array<ThemeablePath> {
    const contract = loadThemeableContract();
    const entry = contract[themeableInterfaceName(seriesType)];
    if (entry == null) {
        throw new Error(`No \`${themeableInterfaceName(seriesType)}\` in the themeable options contract.`);
    }

    const state: ExpandState = { contract, out: [], emitted: new Set() };
    expand(state, { entry, bindings: new Map() }, [], 0, new Set([entry.name]), new Set());
    return state.out;
}
