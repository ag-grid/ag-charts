import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as community from 'ag-charts-community';
import {
    type ModuleDefinition,
    ModuleType,
    type OptionsDefs,
    type Validator,
    contributionHost,
    contributionsOf,
    describeValidator,
    isFunction,
    isObject,
    parseOptionsPath,
} from 'ag-charts-core';

/**
 * Derives the module tables that mirror the exported module definitions, so that adding a module or
 * a contribution updates them in one place: the community `ExpectedModules` placeholders, the ESLint
 * example-validation mappings, and the documentation module list. Run with `UPDATE_MODULE_TABLES=1`
 * to rewrite the generated files; without it, the test fails when they have drifted.
 */
const here = __dirname;
const repoRoot = resolve(here, '../../..');
const paths = {
    enterpriseMain: resolve(here, 'main.ts'),
    expectedModules: resolve(repoRoot, 'packages/ag-charts-community/src/chart/factory/expectedModules.generated.ts'),
    eslintMappings: resolve(repoRoot, 'libraries/ag-charts-eslint-rules/rules/module-mappings.generated.mjs'),
    docsModules: resolve(repoRoot, 'packages/ag-charts-website/src/content/module-mappings/modules.json'),
};
const update = process.env.UPDATE_MODULE_TABLES === '1';
const refreshHint = 'Run `UPDATE_MODULE_TABLES=1 yarn nx test ag-charts-enterprise -- moduleTables` to regenerate.';

const moduleTypes = new Set<string>(Object.values(ModuleType));
const typeOrder = [
    ModuleType.Chart,
    ModuleType.Axis,
    ModuleType.Series,
    ModuleType.Plugin,
    ModuleType.AxisPlugin,
    ModuleType.SeriesPlugin,
    ModuleType.Preset,
];

type Definition = ModuleDefinition & {
    chartType?: string;
    optionsKey?: string;
    axisTypes?: string[];
    seriesTypes?: string[];
    apiName?: string;
};

function isDefinition(value: unknown): value is Definition {
    return (
        isObject(value) &&
        typeof value.name === 'string' &&
        typeof value.version === 'string' &&
        typeof value.type === 'string' &&
        moduleTypes.has(value.type) &&
        typeof value.create === 'function'
    );
}

function flattenBundle(value: unknown): Definition[] | undefined {
    if (!Array.isArray(value) || value.length === 0) return;
    const members: Definition[] = [];
    for (const entry of value) {
        if (isDefinition(entry)) {
            members.push(entry);
        } else {
            const nested = flattenBundle(entry);
            if (nested == null) return;
            members.push(...nested);
        }
    }
    return members;
}

interface PackageExports {
    definitions: Map<string, Definition>;
    bundles: Map<string, Definition[]>;
}

function collectExports(namespace: Record<string, unknown>): PackageExports {
    const definitions = new Map<string, Definition>();
    const bundles = new Map<string, Definition[]>();
    for (const [name, value] of Object.entries(namespace)) {
        if (isDefinition(value)) {
            definitions.set(name, value);
        } else {
            const members = flattenBundle(value);
            if (members != null) bundles.set(name, members);
        }
    }
    return { definitions, bundles };
}

/** Enterprise re-exports are read from `main.ts` by source, as vitest lets the community star export shadow them. */
async function collectEnterpriseExports(): Promise<PackageExports> {
    const source = readFileSync(paths.enterpriseMain, 'utf-8');
    const namespace: Record<string, unknown> = {};
    const statements = [...source.matchAll(/^export \{([^}]+)\} from '(\.\/[^']+)';/gm)];
    expect(statements).toHaveLength(source.match(/^export \{/gm)?.length ?? 0);
    for (const match of statements) {
        const imported = await import(resolve(here, `${match[2]}.ts`));
        for (const name of match[1].split(',').map(
            (part) =>
                part
                    .trim()
                    .split(/\s+as\s+/)
                    .at(-1)!
        )) {
            if (name.length > 0) namespace[name] = imported[name];
        }
    }
    return collectExports(namespace);
}

interface ModuleCatalogue {
    /** Registry name -> the definition the placeholder describes. */
    byName: Map<string, Definition>;
    /** Every definition reachable from a public export, keyed to the public id that registers it. */
    idOf: Map<Definition, string>;
    communityIds: Set<string>;
    definitionIds: Set<string>;
    bundleIds: Set<string>;
    /** Public id -> the definitions registering it brings in, transitively, per exporting package. */
    communityClosures: Map<string, Set<Definition>>;
    enterpriseClosures: Map<string, Set<Definition>>;
    communityDefinitions: Map<string, Definition>;
    enterpriseDefinitions: Map<string, Definition>;
    communityBundles: Map<string, Definition[]>;
    enterpriseBundles: Map<string, Definition[]>;
}

function dependencyClosure(roots: Iterable<Definition>, into = new Set<Definition>()): Set<Definition> {
    for (const root of roots) {
        if (into.has(root)) continue;
        into.add(root);
        dependencyClosure(root.dependencies ?? [], into);
    }
    return into;
}

function buildCatalogue(communityExports: PackageExports, enterpriseExports: PackageExports): ModuleCatalogue {
    const idOf = new Map<Definition, string>();
    const communityIds = new Set([...communityExports.definitions.keys(), ...communityExports.bundles.keys()]);
    const definitionIds = new Set([...communityExports.definitions.keys(), ...enterpriseExports.definitions.keys()]);
    const bundleIds = new Set([...communityExports.bundles.keys(), ...enterpriseExports.bundles.keys()]);

    function packageClosures({ definitions, bundles }: PackageExports) {
        const closures = new Map<string, Set<Definition>>();
        for (const [id, definition] of definitions) {
            idOf.set(definition, id);
            closures.set(id, dependencyClosure([definition]));
        }
        for (const [id, members] of bundles) {
            closures.set(id, dependencyClosure(members));
        }
        return closures;
    }
    const communityClosures = packageClosures(communityExports);
    const enterpriseClosures = packageClosures(enterpriseExports);
    const closures = new Map<string, Set<Definition>>();
    for (const [id, closure] of [...communityClosures, ...enterpriseClosures]) {
        closures.set(id, new Set([...(closures.get(id) ?? []), ...closure]));
    }

    // A definition that is not exported itself is named after the smallest public bundle, failing that
    // the smallest public definition, whose registration brings it in.
    const bySize = [...closures].sort(([a, aClosure], [b, bClosure]) => {
        const bundleFirst = Number(bundleIds.has(b)) - Number(bundleIds.has(a));
        if (bundleFirst !== 0) return bundleFirst;
        return aClosure.size === bClosure.size ? a.localeCompare(b) : aClosure.size - bClosure.size;
    });
    for (const [id, closure] of bySize) {
        for (const definition of closure) {
            if (!idOf.has(definition)) idOf.set(definition, id);
        }
    }

    // The community variant describes a name registered by both packages, unless the enterprise variant
    // owns option locations the community one does not.
    const byName = new Map<string, Definition>();
    for (const definition of idOf.keys()) {
        const existing = byName.get(definition.name);
        if (existing == null) {
            byName.set(definition.name, definition);
        } else if (existing !== definition && !existing.enterprise && definition.enterprise) {
            if ((definition.contributes?.length ?? 0) > 0) byName.set(definition.name, definition);
        } else if (existing !== definition && existing.enterprise && !definition.enterprise) {
            if ((existing.contributes?.length ?? 0) === 0) byName.set(definition.name, definition);
        }
    }

    return {
        byName,
        idOf,
        communityIds,
        definitionIds,
        bundleIds,
        communityClosures,
        enterpriseClosures,
        communityDefinitions: communityExports.definitions,
        enterpriseDefinitions: enterpriseExports.definitions,
        communityBundles: communityExports.bundles,
        enterpriseBundles: enterpriseExports.bundles,
    };
}

/** A generated placeholder keeps only the shape of a contribution's validator, as one of these core validators. */
type PlaceholderValidator = 'object' | 'array' | 'callback' | 'defined';

class RawIdentifier {
    constructor(readonly name: string) {}
}

function placeholderValidator(options: OptionsDefs<any> | Validator | undefined): PlaceholderValidator | undefined {
    if (options == null) return;
    if (!isFunction(options)) return 'object';
    switch (describeValidator(options)) {
        case 'an object':
            return 'object';
        case 'an array':
        case 'an object array':
            return 'array';
        case 'a function':
            return 'callback';
        default:
            return 'defined';
    }
}

function compact<T extends object>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function sortedPlaceholders(catalogue: ModuleCatalogue) {
    return [...catalogue.byName.values()]
        .sort((a, b) => {
            const byType = typeOrder.indexOf(a.type as ModuleType) - typeOrder.indexOf(b.type as ModuleType);
            return byType === 0 ? a.name.localeCompare(b.name) : byType;
        })
        .map((definition) =>
            compact({
                type: definition.type,
                name: definition.name,
                moduleId: catalogue.idOf.get(definition)!,
                chartType: definition.chartType,
                enterprise: definition.enterprise ? true : undefined,
                optionsKey: definition.optionsKey,
                axisTypes: definition.axisTypes,
                seriesTypes: definition.seriesTypes,
                apiName: definition.apiName,
                contributes: definition.contributes?.map((contribution) =>
                    compact({
                        path: contribution.path,
                        options: placeholderValidator(contribution.options),
                        chartTypes: contribution.chartTypes,
                        axisTypes: contribution.axisTypes,
                        seriesTypes: contribution.seriesTypes,
                        requested: contribution.requested,
                        apiName: contribution.apiName,
                    })
                ),
            })
        );
}

function literal(value: unknown, indent: string): string {
    if (value instanceof RawIdentifier) return value.name;
    const inner = `${indent}    `;
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const entries = value.map((entry) => `${inner}${literal(entry, inner)},`).join('\n');
        return `[\n${entries}\n${indent}]`;
    }
    if (isObject(value)) {
        const entries = Object.entries(value)
            .map(([key, entry]) => `${inner}${key}: ${literal(entry, inner)},`)
            .join('\n');
        return `{\n${entries}\n${indent}}`;
    }
    if (typeof value === 'string') return `'${value.replaceAll("'", "\\'")}'`;
    return String(value);
}

function mapLiteral(entries: Iterable<[string, unknown]>): string {
    return `new Map(${literal(
        [...entries].sort(([a], [b]) => a.localeCompare(b)),
        ''
    )})`;
}

function setLiteral(values: Iterable<string>): string {
    return `new Set(${literal(
        [...values].sort((a, b) => a.localeCompare(b)),
        ''
    )})`;
}

const generatedBanner = (kind: string) =>
    `// ${kind} generated from the exported module definitions by\n// packages/ag-charts-enterprise/src/moduleTables.test.ts. Do not edit by hand:\n// ${refreshHint}\n`;

function withRawValidators(placeholders: object[]): object[] {
    return placeholders.map((placeholder) => {
        const { contributes } = placeholder as { contributes?: { options?: PlaceholderValidator }[] };
        if (contributes == null) return placeholder;
        return {
            ...placeholder,
            contributes: contributes.map((contribution) =>
                contribution.options == null
                    ? contribution
                    : { ...contribution, options: new RawIdentifier(contribution.options) }
            ),
        };
    });
}

function expectedModulesSource(placeholders: object[]): string {
    const table = literal(withRawValidators(placeholders), '');
    const validators = (['array', 'callback', 'defined', 'object'] as const).filter((name) =>
        table.includes(`options: ${name},`)
    );
    return [
        generatedBanner('Module placeholders'),
        ...(validators.length > 0 ? [`import { ${validators.join(', ')} } from 'ag-charts-core';`, ''] : []),
        `import type { ModulePlaceholder } from './modulePlaceholder';`,
        '',
        `export const expectedModuleTable: readonly ModulePlaceholder[] = ${table};`,
        '',
    ].join('\n');
}

interface EslintMappings {
    seriesTypeToModule: Map<string, string>;
    axisTypeToModule: Map<string, string>;
    pluginOptionToModule: Map<string, string>;
    axisPluginToModule: Map<string, string>;
    polarAxisPluginToModule: Map<string, string>;
    axisListenerToModule: Map<string, string>;
    chartListenerToModule: Map<string, string>;
    seriesPluginToModule: Map<string, string>;
    seriesChartType: Map<string, string>;
    cartesianSeriesModules: Set<string>;
    polarSeriesModules: Set<string>;
    enterpriseModules: Set<string>;
    impliedModules: Map<string, string[]>;
    enterpriseImpliedModules: Map<string, string[]>;
    bundleContents: Map<string, string[]>;
    enterpriseBundleContents: Map<string, string[]>;
    validModuleIds: Set<string>;
    moduleToPackage: Map<string, string>;
}

/** Public ids among a definition's transitive dependencies; internal dependencies fold into their dependents. */
function impliedIds(definition: Definition, catalogue: ModuleCatalogue): string[] {
    const ids = new Set<string>();
    for (const dependency of dependencyClosure(definition.dependencies ?? [])) {
        const id = catalogue.idOf.get(dependency);
        if (id != null && catalogue.definitionIds.has(id)) ids.add(id);
    }
    return [...ids].sort((a, b) => a.localeCompare(b));
}

function eslintMappings(catalogue: ModuleCatalogue): EslintMappings {
    const { byName, idOf, communityIds, definitionIds, bundleIds } = catalogue;
    const tables: EslintMappings = {
        seriesTypeToModule: new Map(),
        axisTypeToModule: new Map(),
        pluginOptionToModule: new Map(),
        axisPluginToModule: new Map(),
        polarAxisPluginToModule: new Map(),
        axisListenerToModule: new Map(),
        chartListenerToModule: new Map(),
        seriesPluginToModule: new Map(),
        seriesChartType: new Map(),
        cartesianSeriesModules: new Set(),
        polarSeriesModules: new Set(),
        enterpriseModules: new Set([...definitionIds].filter((id) => !communityIds.has(id))),
        impliedModules: new Map(),
        enterpriseImpliedModules: new Map(),
        bundleContents: new Map(),
        enterpriseBundleContents: new Map(),
        validModuleIds: new Set([...definitionIds, ...bundleIds]),
        moduleToPackage: new Map(
            [...definitionIds, ...bundleIds].map((id) => [
                id,
                communityIds.has(id) ? 'ag-charts-community' : 'ag-charts-enterprise',
            ])
        ),
    };

    for (const definition of byName.values()) {
        const id = idOf.get(definition)!;
        switch (definition.type) {
            case ModuleType.Series:
                tables.seriesTypeToModule.set(definition.name, id);
                if (definition.chartType != null) tables.seriesChartType.set(definition.name, definition.chartType);
                if (definition.chartType === 'cartesian') tables.cartesianSeriesModules.add(id);
                if (definition.chartType === 'polar') tables.polarSeriesModules.add(id);
                break;
            case ModuleType.Axis:
                tables.axisTypeToModule.set(definition.name, id);
                break;
            case ModuleType.Plugin:
            case ModuleType.AxisPlugin:
            case ModuleType.SeriesPlugin:
                for (const contribution of contributionsOf(definition)) {
                    const { host, relative } = contributionHost(parseOptionsPath(contribution.path));
                    const keys = relative.segments.map((segment) => segment.key);
                    const [head, ...rest] = keys;
                    if (host === 'axis') {
                        if (keys.length === 1) {
                            const polar = definition.chartType === 'polar';
                            (polar ? tables.polarAxisPluginToModule : tables.axisPluginToModule).set(head, id);
                        } else if (keys.length === 2 && head === 'listeners') {
                            tables.axisListenerToModule.set(rest[0], id);
                        }
                    } else if (host === 'series') {
                        if (keys.length === 1) tables.seriesPluginToModule.set(head, id);
                    } else if (keys.length === 1) {
                        tables.pluginOptionToModule.set(head, id);
                    } else if (keys.length === 2 && head === 'listeners') {
                        tables.chartListenerToModule.set(rest[0], id);
                    }
                }
                break;
        }
    }

    for (const [id, definition] of [...catalogue.communityDefinitions, ...catalogue.enterpriseDefinitions]) {
        const implied = impliedIds(definition, catalogue).filter((impliedId) => impliedId !== id);
        if (implied.length === 0) continue;
        const communityVariant = catalogue.communityDefinitions.get(id);
        if (communityVariant != null && communityVariant !== definition) {
            const communityImplied = new Set(impliedIds(communityVariant, catalogue));
            const extra = implied.filter((impliedId) => !communityImplied.has(impliedId));
            if (extra.length > 0) tables.enterpriseImpliedModules.set(id, extra);
        } else {
            tables.impliedModules.set(id, implied);
        }
    }

    function bundleContents(bundleId: string, closures: Map<string, Set<Definition>>) {
        const contained = closures.get(bundleId)!;
        const ids = new Set<string>();
        for (const member of contained) {
            const id = idOf.get(member)!;
            if (definitionIds.has(id)) ids.add(id);
        }
        // Bundles wholly contained in this one are redundant alongside it, so they are listed as members too.
        for (const [otherId, otherClosure] of closures) {
            if (otherId !== bundleId && bundleIds.has(otherId) && [...otherClosure].every((m) => contained.has(m))) {
                ids.add(otherId);
            }
        }
        return [...ids].sort((a, b) => a.localeCompare(b));
    }
    for (const bundleId of catalogue.communityBundles.keys()) {
        tables.bundleContents.set(bundleId, bundleContents(bundleId, catalogue.communityClosures));
    }
    for (const bundleId of catalogue.enterpriseBundles.keys()) {
        const target = catalogue.communityBundles.has(bundleId)
            ? tables.enterpriseBundleContents
            : tables.bundleContents;
        target.set(bundleId, bundleContents(bundleId, catalogue.enterpriseClosures));
    }

    return tables;
}

function eslintMappingsSource(tables: EslintMappings): string {
    const exportsSource = Object.entries(tables).map(([name, table]) => {
        const value = table instanceof Set ? setLiteral(table) : mapLiteral(table);
        return `export const ${name} = ${value};`;
    });
    return [generatedBanner('Module mappings'), ...exportsSource, ''].join('\n');
}

function normalise(value: unknown): unknown {
    if (value instanceof Map) return normalise(Object.fromEntries(value));
    if (value instanceof Set) return [...value].sort((a, b) => String(a).localeCompare(String(b)));
    return JSON.parse(
        JSON.stringify(value, (_key, entry) => (isFunction(entry) ? placeholderValidator(entry) : entry))
    );
}

describe('module tables', async () => {
    const catalogue = buildCatalogue(collectExports(community), await collectEnterpriseExports());
    const placeholders = sortedPlaceholders(catalogue);
    const mappings = eslintMappings(catalogue);

    it('derives placeholders from the exported definitions', () => {
        expect(placeholders.length).toBeGreaterThan(50);
    });

    it('keeps the community expected-modules table in step with the definitions', async () => {
        const source = expectedModulesSource(placeholders);
        if (update) {
            writeFileSync(paths.expectedModules, source);
            return;
        }
        expect(existsSync(paths.expectedModules), refreshHint).toBe(true);
        const generated = await import(paths.expectedModules);
        expect(normalise(generated.expectedModuleTable), refreshHint).toEqual(normalise(placeholders));
    });

    it('keeps the ESLint module mappings in step with the definitions', async () => {
        const source = eslintMappingsSource(mappings);
        if (update) {
            writeFileSync(paths.eslintMappings, source);
            return;
        }
        expect(existsSync(paths.eslintMappings), refreshHint).toBe(true);
        const generated = await import(paths.eslintMappings);
        for (const [name, table] of Object.entries(mappings)) {
            expect(normalise(generated[name]), `${name}: ${refreshHint}`).toEqual(normalise(table));
        }
    });

    it('lists only exported module ids in the documentation module list', () => {
        const docs = JSON.parse(readFileSync(paths.docsModules, 'utf-8')) as {
            groups: { children: { moduleName?: string }[] }[];
        };
        const knownIds = new Set([...catalogue.definitionIds, ...catalogue.bundleIds]);
        const documented = docs.groups.flatMap((group) => group.children.map((child) => child.moduleName));
        const unknown = documented.filter((name) => name != null && !knownIds.has(name));
        expect(unknown).toEqual([]);
    });
});
