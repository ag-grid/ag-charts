import {
    Debug,
    type Logger,
    ModuleRegistry,
    type ModuleScope,
    ModuleType,
    type OptionsContribution,
    type OptionsDefs,
    type OptionsPath,
    type PlainObject,
    type ResolvedContribution,
    composeContributedDefs,
    contributionMatchesChartType,
    contributionsOf,
    createScopedCache,
    deepClone,
    deepFreeze,
    groupBy,
    isContributionRequested,
    isDefined,
    isObject,
    resolveContributions,
    visitOptionsPath,
} from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { ChartTheme } from '../themes/chartTheme';
import { ExpectedModules, type ModulePlaceholder } from './expectedModules';

const SkippedModules = new Set<string>(['foreground']);

const sanitizedThemeCaches = createScopedCache(
    () => ({ themes: new WeakMap<ChartTheme, ChartTheme>() }),
    (cache) => {
        cache.themes = new WeakMap();
    }
);
const sanitizedThemeCacheDebug = Debug.create(true, 'perf', 'theme');

export function sanitizeThemeModules(
    theme: ChartTheme,
    moduleRegistry: ModuleScope = ModuleRegistry.resolveModuleScope()
): ChartTheme {
    const { themes: sanitizedThemeCache } = sanitizedThemeCaches.for(moduleRegistry);
    const cached = sanitizedThemeCache.get(theme);
    if (cached !== undefined) {
        sanitizedThemeCacheDebug('[CACHE] SanitizedTheme', 'hit');
        return cached;
    }

    sanitizedThemeCacheDebug('[CACHE] SanitizedTheme', 'miss');
    const result = sanitizeThemeModulesUncached(theme, moduleRegistry);
    sanitizedThemeCache.set(theme, result);
    return result;
}

/** Test-only: drop all cached entries so cases start from a known cold state. */
export function __clearSanitizedThemeCacheForTests() {
    sanitizedThemeCaches.clear();
}

function sanitizeThemeModulesUncached(theme: ChartTheme, moduleRegistry: ModuleScope): ChartTheme {
    const missingByType = new Map<string, Set<string>>();
    const missingPlaceholders: ModulePlaceholder[] = [];

    for (const [name, module] of ExpectedModules) {
        if (contributionsOf(module).length === 0) {
            if (moduleRegistry.hasModule(name)) continue;
            let names = missingByType.get(module.type);
            if (names == null) {
                names = new Set();
                missingByType.set(module.type, names);
            }
            names.add(name);
        } else {
            missingPlaceholders.push(module);
        }
    }

    const missingContributions = uncoveredContributions(missingPlaceholders, moduleRegistry, undefined);

    if (missingByType.size === 0 && missingContributions.length === 0) return theme;

    // A template default is never a user request; only a user-supplied explicit `enabled: true` is,
    // and only where the contribution is requested by that flag rather than by mere presence.
    function isPrunable(contribution: OptionsContribution, value: unknown, userSupplied: boolean) {
        if (!userSupplied || contribution.requested === 'present') return true;
        return !isObject(value) || value.enabled !== true;
    }

    function pruneHost(host: unknown, contribution: OptionsContribution, relative: OptionsPath, userSupplied: boolean) {
        visitOptionsPath(host, relative, (target, key) => {
            if (key in target && isPrunable(contribution, target[key], userSupplied)) {
                delete target[key];
            }
        });
    }

    function pruneEntry(entry: PlainObject | undefined, userSupplied: boolean) {
        if (!isObject(entry)) return;
        const axes = isObject(entry.axes) ? entry.axes : undefined;
        if (axes != null) {
            for (const axisName of Object.keys(axes)) {
                if (missingByType.get(ModuleType.Axis)?.has(axisName)) {
                    delete axes[axisName];
                }
            }
        }
        for (const { contribution, host, relative } of missingContributions) {
            if (host === 'chart') {
                pruneHost(entry, contribution, relative, userSupplied);
            } else if (host === 'series') {
                pruneHost(entry.series, contribution, relative, userSupplied);
            } else if (axes != null) {
                for (const axis of Object.values(axes)) {
                    pruneHost(axis, contribution, relative, userSupplied);
                }
            }
        }
    }

    const config = deepClone(theme.config);
    const overrides = deepClone(theme.overrides);
    const presets = deepClone(theme.presets);

    for (const seriesType of Object.keys(config)) {
        if (missingByType.get(ModuleType.Series)?.has(seriesType)) {
            delete config[seriesType];
            continue;
        }
        pruneEntry(config[seriesType], false);
    }

    if (isObject(overrides)) {
        const overridesObj = overrides as PlainObject;
        for (const seriesType of Object.keys(overridesObj)) {
            if (seriesType !== 'common' && missingByType.get(ModuleType.Series)?.has(seriesType)) {
                delete overridesObj[seriesType];
                continue;
            }
            pruneEntry(overridesObj[seriesType] as PlainObject, true);
        }
    }

    if (isObject(presets)) {
        const presetsObj = presets as PlainObject;
        for (const presetName of Object.keys(presetsObj)) {
            if (
                missingByType.get(ModuleType.Preset)?.has(presetName) ||
                missingByType.get(ModuleType.Series)?.has(presetName)
            ) {
                delete presetsObj[presetName];
                continue;
            }
            pruneEntry(presetsObj[presetName] as PlainObject, true);
        }
    }

    return Object.create(theme, {
        config: { value: deepFreeze(config), enumerable: true },
        overrides: { value: isObject(overrides) ? deepFreeze(overrides) : overrides, enumerable: true },
        presets: { value: isObject(presets) ? deepFreeze(presets) : presets, enumerable: true },
    });
}

export interface MissingModule {
    module: ModulePlaceholder;
    /** Public names of the supplied options that asked for the module, for the UMD feature warning. */
    features: string[];
}

export function processModuleOptions<T extends Partial<AgChartOptions>>(
    chartType: string | undefined,
    options: T,
    additionalMissingModules: ModulePlaceholder[],
    logger: Logger,
    moduleRegistry: ModuleScope
): void {
    const missingModules = removeUnregisteredModuleOptions(chartType, options, moduleRegistry);
    for (const module of additionalMissingModules) {
        if (!missingModules.some((missing) => missing.module === module)) {
            missingModules.push({ module, features: [] });
        }
    }

    if (!missingModules.length) return;

    const installationReferenceUrl = ModuleRegistry.isIntegrated()
        ? 'https://www.ag-grid.com/data-grid/integrated-charts-installation/'
        : 'https://www.ag-grid.com/charts/r/module-registry/';

    const missingOptions = groupBy(missingModules, ({ module }) => (module.enterprise ? 'enterprise' : 'community'));

    if (ModuleRegistry.isUmd()) {
        logger.warnOnce(umdMissingModulesMessage(missingOptions.enterprise ?? []));
    } else {
        const message = bundlerMissingModulesMessage(
            missingModules,
            missingOptions,
            installationReferenceUrl,
            !ModuleRegistry.isGlobalScope(moduleRegistry)
        );
        logger.errorOnce(message);
    }
}

function umdMissingModulesMessage(enterpriseModules: MissingModule[]): string {
    const installationUrl = ModuleRegistry.isIntegrated()
        ? 'https://www.ag-grid.com/data-grid/integrated-charts-installation/'
        : 'https://www.ag-grid.com/charts/javascript/installation/';
    const enterpriseOptions = enterpriseModules.map(formatMissingFeatureName).join('\n');
    return [
        `unable to use these enterprise features as 'ag-charts-enterprise' has not been loaded:`,
        '',
        enterpriseOptions,
        '',
        `See ${installationUrl} for more details.`,
    ].join('\n');
}

function bundlerMissingModulesMessage(
    missingModules: MissingModule[],
    missingOptions: Partial<Record<'enterprise' | 'community', MissingModule[]>>,
    installationReferenceUrl: string,
    instanceModules: boolean
): string {
    const packageName = ModuleRegistry.isEnterprise() || missingOptions.enterprise?.length ? 'enterprise' : 'community';
    return [
        'required modules are not registered. Check if you have registered the modules:',
        '',
        createRegistrySnippet(
            missingModules.map(({ module }) => module.moduleId ?? module.name),
            packageName,
            instanceModules
        ),
        '',
        `See ${installationReferenceUrl} for more details.`,
    ].join('\n');
}

function formatMissingFeatureName({ module, features }: MissingModule): string {
    if (module.apiName != null) return module.apiName;
    return features.length === 0 ? module.name : features.join(' / ');
}

function formatImportItem(name: string) {
    return `    ${name},`;
}

function formatImports(imports: string[], packageName: string) {
    return imports.length
        ? `import {\n${imports.map(formatImportItem).join('\n')}\n} from 'ag-charts-${packageName}';`
        : null;
}

function createRegistrySnippet(moduleNames: string[], packageName: string, instanceModules: boolean): string {
    const moduleList = moduleNames.map(formatImportItem).join('\n');
    if (instanceModules) {
        const imports = formatImports(['AgCharts'].concat(moduleNames), packageName);
        return `${imports}\n\nAgCharts.create(options, {\n    modules: [\n${moduleList.replace(/^/gm, '    ')}\n    ],\n});`;
    }
    const imports = formatImports(['ModuleRegistry'].concat(moduleNames), packageName);
    return `${imports}\n\nModuleRegistry.registerModules([\n${moduleList}\n]);`;
}

export function removeUnregisteredModuleOptions<T extends Partial<AgChartOptions>>(
    chartType: string | undefined,
    options: T,
    moduleRegistry: ModuleScope
): MissingModule[] {
    const missingModules = new Map<string, MissingModule>();
    const optionsAxes = 'axes' in options && isObject(options.axes) ? options.axes : {};
    const axisTypesInOptions = new Set<string>(
        Object.values(optionsAxes)
            .map((axis) => axis?.type)
            .filter(isDefined)
    );
    const seriesTypesInOptions = new Set<string>(options.series?.map((series) => series.type).filter(isDefined));

    function addMissingModule(module: ModulePlaceholder, feature?: string) {
        let missing = missingModules.get(module.name);
        if (missing == null) {
            missing = { module, features: [] };
            missingModules.set(module.name, missing);
        }
        if (feature != null && !missing.features.includes(feature)) {
            missing.features.push(feature);
        }
    }

    const uncovered = uncoveredPlaceholderContributions(moduleRegistry, chartType);

    for (const module of ExpectedModules.values()) {
        if (SkippedModules.has(module.name)) continue;
        // Ignore modules that don't match the current chart type
        if (chartType && module.chartType && chartType !== module.chartType) continue;

        switch (module.type) {
            case 'chart':
                // Chart modules should automatically register as dependencies, so we don't need to warn here.
                break;

            case 'axis':
                if (moduleRegistry.hasModule(module.name)) break;
                if (axisTypesInOptions.has(module.name)) {
                    for (const key of Object.keys(optionsAxes)) {
                        if (optionsAxes?.[key].type === module.name) {
                            delete optionsAxes[key];
                        }
                    }
                    addMissingModule(module);
                }
                break;

            case 'series':
                if (moduleRegistry.hasModule(module.name)) break;
                if (seriesTypesInOptions.has(module.name)) {
                    options.series = (options.series as any[]).filter((series) => series.type !== module.name);
                    addMissingModule(module);
                }
                break;

            default:
                for (const { contribution, path } of uncovered.get(module) ?? []) {
                    if (!contributionMatchesChartType(contribution, chartType)) continue;
                    visitOptionsPath(options, path, (host, key) => {
                        const value = host[key];
                        if (value == null) return;
                        if (isContributionRequested(contribution, value)) {
                            addMissingModule(module, contribution.apiName ?? contribution.path);
                        }
                        delete host[key];
                    });
                }
                break;
        }
    }

    return Array.from(missingModules.values());
}

/**
 * Placeholder contributions whose path no registered module owns for `chartType`. Ownership is by
 * path, not by name: a community `series-area` registration does not cover the enterprise
 * `seriesArea.backgroundRegions`, while `CrossLinesModule` covers `axes[].crossLines` on a cartesian
 * chart but not on a polar one, where `PolarCrossLinesModule` is still missing.
 */
function uncoveredContributions(
    placeholders: Iterable<ModulePlaceholder>,
    moduleRegistry: ModuleScope,
    chartType: string | undefined
): ResolvedContribution<ModulePlaceholder>[] {
    const coveredPaths = new Set<string>();
    for (const { contribution } of moduleRegistry.optionsContributions()) {
        if (contributionMatchesChartType(contribution, chartType)) {
            coveredPaths.add(contribution.path);
        }
    }
    return resolveContributions(placeholders).filter(({ contribution }) => !coveredPaths.has(contribution.path));
}

const placeholderContributionCaches = createScopedCache(
    () => ({
        byChartType: new Map<string | undefined, Map<ModulePlaceholder, ResolvedContribution<ModulePlaceholder>[]>>(),
    }),
    (cache) => {
        cache.byChartType = new Map();
    }
);

/** The uncovered contributions of every expected module, grouped by placeholder and cached per scope revision. */
function uncoveredPlaceholderContributions(moduleRegistry: ModuleScope, chartType: string | undefined) {
    const cache = placeholderContributionCaches.for(moduleRegistry);
    let grouped = cache.byChartType.get(chartType);
    if (grouped == null) {
        grouped = new Map();
        for (const entry of uncoveredContributions(ExpectedModules.values(), moduleRegistry, chartType)) {
            let entries = grouped.get(entry.definition);
            if (entries == null) {
                entries = [];
                grouped.set(entry.definition, entries);
            }
            entries.push(entry);
        }
        cache.byChartType.set(chartType, grouped);
    }
    return grouped;
}

/** Contributions of every module the chart could use: registered ones, then unregistered placeholders. */
function knownContributions(moduleRegistry: ModuleScope, chartType: string): ResolvedContribution[] {
    const known: ResolvedContribution[] = [...moduleRegistry.optionsContributions()];
    for (const entries of uncoveredPlaceholderContributions(moduleRegistry, chartType).values()) {
        known.push(...entries);
    }
    return known;
}

/**
 * Strips options owned by modules that do not apply to `chartType`. Pass `logger` when `options` are
 * the user's, so each dropped option is reported; theme defaults are stripped silently.
 */
export function removeIncompatibleModuleOptions<T extends Partial<AgChartOptions>>(
    chartType: string | undefined,
    options: T,
    moduleRegistry: ModuleScope,
    logger?: Logger
): string[] {
    if (chartType == null) return [];

    const table = knownContributions(moduleRegistry, chartType);
    // Two modules can own one path for different chart types (`crossLines` cartesian/polar), so a
    // path is only stripped when no compatible owner claims it.
    const supportedPaths = new Set<string>();
    for (const { contribution } of table) {
        if (contributionMatchesChartType(contribution, chartType)) {
            supportedPaths.add(contribution.path);
        }
    }

    const incompatibleModules = new Set<string>();
    for (const { definition, contribution, path } of table) {
        if (contributionMatchesChartType(contribution, chartType) || supportedPaths.has(contribution.path)) continue;
        visitOptionsPath(options, path, (host, key, location) => {
            if (!(key in host)) return;
            const requested = isContributionRequested(contribution, host[key]);
            delete host[key];
            incompatibleModules.add(definition.name);
            if (logger == null || !requested) return;
            const seriesType = options.series?.at(0)?.type;
            const seriesTypeMessage = seriesType == null ? 'this series type' : `\`${seriesType}\` series`;
            logger.warn(`Option \`${location}\` is not supported by ${seriesTypeMessage}, ignoring.`);
        });
    }
    return Array.from(incompatibleModules);
}

const composedChartDefsCaches = createScopedCache(
    () => ({ defs: new WeakMap<object, Map<string, OptionsDefs<any>>>() }),
    (cache) => {
        cache.defs = new WeakMap();
    }
);

/**
 * The chart module's defs with every applicable module-owned location installed, so the first
 * validation pass accepts module options and an unregistered module's options survive to be
 * reported. Cached per scope revision so the validator's schema-key cache keeps hitting.
 */
export function composeChartOptionsDefs<T>(
    chartType: string,
    chartDefs: OptionsDefs<T>,
    moduleRegistry: ModuleScope
): OptionsDefs<T> {
    const cache = composedChartDefsCaches.for(moduleRegistry);
    let byChartType = cache.defs.get(chartDefs);
    if (byChartType == null) {
        byChartType = new Map();
        cache.defs.set(chartDefs, byChartType);
    }
    let composed = byChartType.get(chartType) as OptionsDefs<T> | undefined;
    if (composed == null) {
        const applicable = knownContributions(moduleRegistry, chartType).filter(({ contribution }) =>
            contributionMatchesChartType(contribution, chartType)
        );
        composed = composeContributedDefs(chartDefs, applicable);
        byChartType.set(chartType, composed);
    }
    return composed;
}
