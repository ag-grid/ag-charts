import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type TypeNode = string | { kind: string; type?: unknown; typeArguments?: unknown[] };

interface ContractMember {
    kind: string;
    name: string;
    type: TypeNode;
    optional?: boolean;
}

interface ContractEntry {
    kind: string;
    name: string;
    heritage?: unknown[];
    members?: ContractMember[];
}

type Contract = Record<string, ContractEntry>;

export interface ThemeablePath {
    path: Array<string>;
    type: TypeNode;
}

const CONTRACT_RELATIVE_PATH = join('dist', 'packages', 'ag-charts-types', 'resolved-interfaces.AUTO.json');

/** Nested option interfaces bottom out well within this; the limit only guards pathological self-reference. */
const MAX_DEPTH = 5;

let contractCache: Contract | undefined;

function findUpwards(relativePath: string) {
    let dir = process.cwd();
    for (let i = 0; i < 8; i++) {
        const candidate = join(dir, relativePath);
        if (existsSync(candidate)) return candidate;
        const parent = dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return undefined;
}

export function loadThemeableContract(): Contract {
    if (contractCache) return contractCache;

    const contractPath = findUpwards(CONTRACT_RELATIVE_PATH);
    if (contractPath == null) {
        throw new Error(
            `Themeable options contract not found at ${CONTRACT_RELATIVE_PATH}. ` +
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

function omittedKeys(keys: unknown): Set<string> {
    const literals = new Set<string>();
    const collect = (node: unknown) => {
        if (typeof node === 'string') {
            for (const part of node.split('|')) {
                literals.add(part.trim().replace(/^'|'$/g, ''));
            }
        } else if (node != null && typeof node === 'object') {
            const union = node as { type?: unknown };
            if (Array.isArray(union.type)) union.type.forEach(collect);
        }
    };
    collect(keys);
    return literals;
}

function expand(
    contract: Contract,
    entry: ContractEntry,
    prefix: Array<string>,
    depth: number,
    seen: Set<string>,
    out: Array<ThemeablePath>,
    omit: Set<string>
) {
    for (const heritage of entry.heritage ?? []) {
        const name = typeName(heritage);
        if (name === 'Omit') {
            const [target, keys] = ((heritage as { typeArguments?: unknown[] }).typeArguments ?? []) as unknown[];
            const targetEntry = contract[typeName(target) ?? ''];
            if (targetEntry && !seen.has(targetEntry.name)) {
                const nextSeen = new Set(seen).add(targetEntry.name);
                expand(contract, targetEntry, prefix, depth, nextSeen, out, omittedKeys(keys));
            }
            continue;
        }

        const base = contract[name ?? ''];
        if (base && !seen.has(base.name)) {
            expand(contract, base, prefix, depth, new Set(seen).add(base.name), out, omit);
        }
    }

    for (const member of entry.members ?? []) {
        // Undocumented internals (`_enabledFromTheme`) are exercised explicitly, not enumerated.
        if (member.kind !== 'member' || omit.has(member.name) || member.name.startsWith('_')) continue;

        const nested = contract[typeName(member.type) ?? ''];
        if (nested?.kind === 'interface' && depth < MAX_DEPTH && !seen.has(nested.name)) {
            const nextSeen = new Set(seen).add(nested.name);
            expand(contract, nested, [...prefix, member.name], depth + 1, nextSeen, out, new Set());
        } else {
            out.push({ path: [...prefix, member.name], type: member.type });
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
    if (entry == null) return [];

    const out: Array<ThemeablePath> = [];
    expand(contract, entry, [], 0, new Set([entry.name]), out, new Set());
    return out;
}
