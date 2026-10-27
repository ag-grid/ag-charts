import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as community from 'ag-charts-community';
import {
    type ModuleDefinition,
    ModuleType,
    type OptionsContribution,
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
    chartTypes?: readonly string[];
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
        for (const name of match[1].split(',').map((part) =>
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
    definitionIds: Set<string>;
    bundleIds: Set<string>;
    /** Public id -> the definitions registering it brings in, transitively, per exporting package. */
    communityClosures: Map<string, Set<Definition>>;
    enterpriseClosures: Map<string, Set<Definition>>;
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
            if (contributionsOf(definition).length > 0) byName.set(definition.name, definition);
        } else if (existing !== definition && existing.enterprise && !definition.enterprise) {
            if (contributionsOf(existing).length === 0) byName.set(definition.name, definition);
        }
    }

    return {
        byName,
        idOf,
        definitionIds,
        bundleIds,
        communityClosures,
        enterpriseClosures,
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

/** Whether `contributionsOf` will restore `chartTypes` from the placeholder's own. */
function inheritedChartTypes(definition: Definition, contribution: OptionsContribution) {
    const { chartTypes } = definition;
    return chartTypes != null && contribution.chartTypes === chartTypes;
}

/** Placeholders carry neither `options` nor `themeTemplate`, so their locations are spelled out. */
function placeholderContributions(definition: Definition) {
    const contributions = contributionsOf(definition);
    return contributions.length > 0 ? contributions : undefined;
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
                chartTypes: definition.chartTypes,
                enterprise: definition.enterprise ? true : undefined,
                optionsKey: definition.optionsKey,
                axisTypes: definition.axisTypes,
                seriesTypes: definition.seriesTypes,
                apiName: definition.apiName,
                contributes: mergeAxisTypes(
                    placeholderContributions(definition)?.map((contribution) => {
                        const options = placeholderValidator(contribution.options);
                        const themeOptions = placeholderValidator(contribution.themeOptions);
                        return compact({
                            path: contribution.path,
                            options,
                            themeOptions: themeOptions === options ? undefined : themeOptions,
                            chartTypes: inheritedChartTypes(definition, contribution)
                                ? undefined
                                : contribution.chartTypes,
                            axisTypes: contribution.axisTypes,
                            seriesTypes: contribution.seriesTypes,
                            requested: contribution.requested,
                            apiName: contribution.apiName,
                        });
                    })
                ),
            })
        );
}

/** Placeholder validators are coarser than the real ones, so per-axis-type contributions often collapse to one. */
function mergeAxisTypes<T extends { axisTypes?: readonly string[] }>(contributions: T[] | undefined) {
    if (contributions == null) return;
    const merged: T[] = [];
    const indexByShape = new Map<string, number>();
    for (const contribution of contributions) {
        const { axisTypes, ...shape } = contribution;
        const key = JSON.stringify(shape);
        const index = indexByShape.get(key);
        const previousAxisTypes = index == null ? undefined : merged[index].axisTypes;
        if (axisTypes == null || index == null || previousAxisTypes == null) {
            if (axisTypes != null) indexByShape.set(key, merged.length);
            merged.push(contribution);
        } else {
            merged[index] = { ...merged[index], axisTypes: [...previousAxisTypes, ...axisTypes] };
        }
    }
    return merged;
}

type Placeholder = ReturnType<typeof sortedPlaceholders>[number];

const validatorKeys = new Set(['options', 'themeOptions']);

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

function withRawValidators(placeholders: Placeholder[], used: Set<PlaceholderValidator>): object[] {
    return placeholders.map(({ contributes, ...placeholder }) => {
        if (contributes == null) return placeholder;
        return {
            ...placeholder,
            contributes: contributes.map((contribution) =>
                Object.fromEntries(
                    Object.entries(contribution).map(([key, value]) => {
                        if (!validatorKeys.has(key)) return [key, value];
                        used.add(value as PlaceholderValidator);
                        return [key, new RawIdentifier(value as PlaceholderValidator)];
                    })
                )
            ),
        };
    });
}

function expectedModulesSource(placeholders: Placeholder[]): string {
    const used = new Set<PlaceholderValidator>();
    const table = literal(withRawValidators(placeholders, used), '');
    const validators = [...used].sort((a, b) => a.localeCompare(b));
    return [
        generatedBanner('Module placeholders'),
        ...(validators.length > 0 ? [`import { ${validators.join(', ')} } from 'ag-charts-core';`, ''] : []),
        `import type { ModulePlaceholder } from './modulePlaceholder';`,
        '',
        `export const expectedModuleTable: readonly ModulePlaceholder[] = ${table};`,
        '',
    ].join('\n');
}

interface DefinitionEntry {
    moduleId: string;
    enterprise?: true;
}

/** Requirement tables name the owning definition by its registry `name`, as the chart's module registry does. */
interface EslintMappings {
    seriesTypeToDefinition: Map<string, string>;
    axisTypeToDefinition: Map<string, string>;
    pluginOptionToDefinition: Map<string, string>;
    /** Dotted chart-host paths below the root, e.g. `seriesArea.backgroundRegions`. */
    chartOptionPathToDefinition: Map<string, string>;
    axisPluginToDefinition: Map<string, string>;
    polarAxisPluginToDefinition: Map<string, string>;
    axisListenerToDefinition: Map<string, string>;
    chartListenerToDefinition: Map<string, string>;
    seriesPluginToDefinition: Map<string, string>;
    seriesChartType: Map<string, string>;
    cartesianSeriesModules: Set<string>;
    polarSeriesModules: Set<string>;
    /** Definition name -> the exported id a missing-module report names, and whether the definition is enterprise. */
    definitions: Map<string, DefinitionEntry>;
    /** Exported id -> the definitions its registration brings in. */
    moduleContents: Map<string, string[]>;
    /** As `moduleContents`, for enterprise exports that are not the same modules as the community ones. */
    enterpriseModuleContents: Map<string, string[]>;
    bundleContents: Map<string, string[]>;
    validModuleIds: Set<string>;
}

const requirementTables = [
    'seriesTypeToDefinition',
    'axisTypeToDefinition',
    'pluginOptionToDefinition',
    'chartOptionPathToDefinition',
    'axisPluginToDefinition',
    'polarAxisPluginToDefinition',
    'axisListenerToDefinition',
    'chartListenerToDefinition',
    'seriesPluginToDefinition',
] as const;

function requirementOwners(tables: EslintMappings): Set<string> {
    return new Set(requirementTables.flatMap((table) => [...tables[table].values()]));
}

function namesOf(closure: Set<Definition>): string[] {
    return [...new Set([...closure].map((definition) => definition.name))].sort((a, b) => a.localeCompare(b));
}

function eslintMappings(catalogue: ModuleCatalogue): EslintMappings {
    const { byName, idOf, definitionIds, bundleIds } = catalogue;
    const tables: EslintMappings = {
        seriesTypeToDefinition: new Map(),
        axisTypeToDefinition: new Map(),
        pluginOptionToDefinition: new Map(),
        chartOptionPathToDefinition: new Map(),
        axisPluginToDefinition: new Map(),
        polarAxisPluginToDefinition: new Map(),
        axisListenerToDefinition: new Map(),
        chartListenerToDefinition: new Map(),
        seriesPluginToDefinition: new Map(),
        seriesChartType: new Map(),
        cartesianSeriesModules: new Set(),
        polarSeriesModules: new Set(),
        definitions: new Map(),
        moduleContents: new Map(),
        enterpriseModuleContents: new Map(),
        bundleContents: new Map(),
        validModuleIds: new Set([...definitionIds, ...bundleIds]),
    };

    for (const [name, definition] of byName) {
        const id = idOf.get(definition)!;
        switch (definition.type) {
            case ModuleType.Series:
                tables.seriesTypeToDefinition.set(name, name);
                if (definition.chartType != null) tables.seriesChartType.set(name, definition.chartType);
                if (definition.chartType === 'cartesian') tables.cartesianSeriesModules.add(id);
                if (definition.chartType === 'polar') tables.polarSeriesModules.add(id);
                break;
            case ModuleType.Axis:
                tables.axisTypeToDefinition.set(name, name);
                break;
            case ModuleType.Plugin:
            case ModuleType.AxisPlugin:
            case ModuleType.SeriesPlugin:
                const chartTypes = definition.chartTypes ?? [];
                const everywhere = chartTypes.length === 0;
                const onCartesian = everywhere || chartTypes.includes('cartesian');
                for (const contribution of contributionsOf(definition)) {
                    const { host, relative } = contributionHost(parseOptionsPath(contribution.path));
                    const keys = relative.segments.map((segment) => segment.key);
                    const [head, ...rest] = keys;
                    if (host === 'axis') {
                        if (keys.length === 1) {
                            if (everywhere || chartTypes.includes('polar'))
                                tables.polarAxisPluginToDefinition.set(head, name);
                            if (onCartesian) tables.axisPluginToDefinition.set(head, name);
                        } else if (keys.length === 2 && head === 'listeners' && onCartesian) {
                            // The ESLint rule has no polar variant for listeners, so a cartesian owner names them.
                            tables.axisListenerToDefinition.set(rest[0], name);
                        }
                    } else if (host === 'series') {
                        if (keys.length === 1) tables.seriesPluginToDefinition.set(head, name);
                    } else if (keys.length === 1) {
                        tables.pluginOptionToDefinition.set(head, name);
                    } else if (keys.length === 2 && head === 'listeners') {
                        if (onCartesian) tables.chartListenerToDefinition.set(rest[0], name);
                    } else {
                        tables.chartOptionPathToDefinition.set(keys.join('.'), name);
                    }
                }
                break;
        }
    }

    for (const name of requirementOwners(tables)) {
        const definition = byName.get(name)!;
        tables.definitions.set(
            name,
            compact({ moduleId: idOf.get(definition)!, enterprise: definition.enterprise ? true : undefined })
        );
    }

    for (const [id, closure] of catalogue.communityClosures) {
        tables.moduleContents.set(id, namesOf(closure));
    }
    for (const [id, closure] of catalogue.enterpriseClosures) {
        const communityClosure = catalogue.communityClosures.get(id);
        if (communityClosure == null) {
            tables.moduleContents.set(id, namesOf(closure));
        } else if ([...closure].some((definition) => !communityClosure.has(definition))) {
            tables.enterpriseModuleContents.set(id, namesOf(closure));
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
        if (!catalogue.communityBundles.has(bundleId)) {
            tables.bundleContents.set(bundleId, bundleContents(bundleId, catalogue.enterpriseClosures));
        }
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

    it('reports each requirement with a module exported by the package its definition belongs to', () => {
        const mismatched = [...mappings.definitions].filter(([, { moduleId, enterprise }]) => {
            const exports = enterprise ? catalogue.enterpriseClosures : catalogue.communityClosures;
            return !exports.has(moduleId);
        });
        expect(mismatched).toEqual([]);
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
