import { type OptionsDefs, type Validator, object } from '../state/validation';
import { isFunction, isObject } from '../utils/types/typeGuards';

/**
 * A location in the options tree owned by a module. Ownership drives validation defs, missing-module
 * reporting, incompatible chart type stripping, theme defaults and the generated module tables, so a
 * module declares each location once here instead of each consumer inferring it from `type` and `name`.
 */
export interface OptionsContribution<TOptions = any> {
    /**
     * Dotted path into the chart options; `[]` marks a segment whose every child is a host, whether it
     * is an array or a keyed record: `zoom`, `seriesArea.backgroundRegions`, `axes[].crossLines`,
     * `series[].errorBar`, `axes[].listeners.click`, `listeners.axisClick`.
     */
    readonly path: string;
    /** Validation for the subtree, or a single validator for a leaf such as a callback. */
    readonly options?: OptionsDefs<TOptions> | Validator;
    /** Defaults merged into the theme at the location derived from `path`. */
    readonly themeTemplate?: object;
    readonly chartTypes?: readonly string[];
    readonly axisTypes?: readonly string[];
    readonly seriesTypes?: readonly string[];
    /**
     * When a supplied value counts as a request for the feature, which decides whether an
     * unregistered owner is reported. `'enabled'` (the default) counts any non-null value other than
     * an object with `enabled: false`; `'present'` counts any non-null value.
     */
    readonly requested?: ContributionRequest;
    /** Public name for the missing-feature warning when `path` alone would not read well. */
    readonly apiName?: string;
}

export type ContributionRequest = 'enabled' | 'present';

export interface OptionsPathSegment {
    readonly key: string;
    /** The segment was written `key[]`: every child of `key` is a host for the rest of the path. */
    readonly each: boolean;
}

export interface OptionsPath {
    readonly source: string;
    readonly segments: readonly OptionsPathSegment[];
}

/** Which host object the path descends into; theme merge and runtime apply differ per host. */
export type ContributionHost = 'chart' | 'axis' | 'series';

const pathCache = new Map<string, OptionsPath>();

export function parseOptionsPath(path: string): OptionsPath {
    let parsed = pathCache.get(path);
    if (parsed != null) return parsed;

    if (path.length === 0) {
        throw new Error('AG Charts - an options contribution path cannot be empty');
    }
    const segments = path.split('.').map((segment): OptionsPathSegment => {
        const each = segment.endsWith('[]');
        const key = each ? segment.slice(0, -2) : segment;
        if (key.length === 0 || key.includes('[') || key.includes(']')) {
            throw new Error(`AG Charts - invalid options contribution path '${path}'`);
        }
        return { key, each };
    });
    if (segments.at(-1)?.each) {
        throw new Error(`AG Charts - an options contribution path cannot end in '[]': '${path}'`);
    }
    parsed = { source: path, segments };
    pathCache.set(path, parsed);
    return parsed;
}

/**
 * Splits a path into the host it descends into and the path relative to one host instance:
 * `axes[].crossLines` is the axis host with relative path `crossLines`; `zoom` is the chart host.
 */
export function contributionHost(path: OptionsPath): { host: ContributionHost; relative: OptionsPath } {
    const [first] = path.segments;
    if (first.each && (first.key === 'axes' || first.key === 'series')) {
        const relative = path.segments
            .slice(1)
            .map(({ key, each }) => (each ? `${key}[]` : key))
            .join('.');
        return { host: first.key === 'axes' ? 'axis' : 'series', relative: parseOptionsPath(relative) };
    }
    return { host: 'chart', relative: path };
}

/** The subset of a module definition (or an expected-module placeholder) that ownership derives from. */
export interface ContributingDefinition {
    readonly type: string;
    readonly name: string;
    readonly chartType?: string;
    readonly optionsKey?: string;
    readonly axisTypes?: readonly string[];
    readonly seriesTypes?: readonly string[];
    readonly options?: OptionsDefs<any>;
    readonly themeTemplate?: object;
    readonly contributes?: readonly OptionsContribution[];
}

/**
 * The locations `definition` owns: its explicit `contributes`, otherwise the single location its
 * module type has always implied. Either way a contribution without `chartTypes` inherits the
 * definition's `chartType`. Chart, axis, series and preset modules own whole subtrees by identity
 * rather than by path and so contribute nothing.
 */
export function contributionsOf(definition: ContributingDefinition): readonly OptionsContribution[] {
    const { name, chartType, options, themeTemplate } = definition;
    const chartTypes = chartType == null ? undefined : [chartType];

    if (definition.contributes != null) {
        if (chartTypes == null) return definition.contributes;
        return definition.contributes.map((contribution) =>
            contribution.chartTypes == null ? { ...contribution, chartTypes } : contribution
        );
    }

    switch (definition.type) {
        case 'plugin':
            return [{ path: name, options, themeTemplate, chartTypes }];
        case 'axis:plugin':
            return [
                {
                    path: `axes[].${definition.optionsKey ?? name}`,
                    options,
                    themeTemplate,
                    chartTypes,
                    axisTypes: definition.axisTypes,
                },
            ];
        case 'series:plugin':
            return [
                {
                    path: `series[].${name}`,
                    options,
                    themeTemplate,
                    chartTypes,
                    seriesTypes: definition.seriesTypes,
                    requested: 'present',
                },
            ];
        default:
            return [];
    }
}

export interface ResolvedContribution<TDefinition extends ContributingDefinition = ContributingDefinition> {
    readonly definition: TDefinition;
    readonly contribution: OptionsContribution;
    readonly path: OptionsPath;
    readonly host: ContributionHost;
    /** `path` relative to one instance of `host`; the same as `path` for the chart host. */
    readonly relative: OptionsPath;
}

/** Whether `contribution` applies to a chart of `chartType`; an undeclared chart type applies to all. */
export function contributionMatchesChartType(contribution: OptionsContribution, chartType: string | undefined) {
    return chartType == null || contribution.chartTypes == null || contribution.chartTypes.includes(chartType);
}

export function contributionMatchesAxisType(contribution: OptionsContribution, axisType: string) {
    return contribution.axisTypes == null || contribution.axisTypes.includes(axisType);
}

export function contributionMatchesSeriesType(contribution: OptionsContribution, seriesType: string) {
    return contribution.seriesTypes == null || contribution.seriesTypes.includes(seriesType);
}

export function resolveContributions<TDefinition extends ContributingDefinition>(
    definitions: Iterable<TDefinition>
): ResolvedContribution<TDefinition>[] {
    const resolved: ResolvedContribution<TDefinition>[] = [];
    for (const definition of definitions) {
        for (const contribution of contributionsOf(definition)) {
            const path = parseOptionsPath(contribution.path);
            resolved.push({ definition, contribution, path, ...contributionHost(path) });
        }
    }
    return resolved;
}

/** Wraps `value` in objects keyed by each segment of `path`: `a.b` gives `{ a: { b: value } }`. */
export function nestAtOptionsPath(path: OptionsPath, value: unknown): Record<string, unknown> {
    let nested = value;
    for (let i = path.segments.length - 1; i >= 0; i--) {
        nested = { [path.segments[i].key]: nested };
    }
    return nested as Record<string, unknown>;
}

export type OptionsPathVisitor = (host: Record<string, unknown>, key: string, location: string) => void;

/**
 * Calls `visit` with the object holding each location `path` names inside `options`, the key of that
 * location on it, and its concrete dotted location (`axes.x.crosshair`, `series[0].errorBar`). An
 * `each` segment fans out over the children of an array or keyed record.
 */
export function visitOptionsPath(options: unknown, path: OptionsPath, visit: OptionsPathVisitor): void {
    visitSegments(options, path.segments, 0, '', visit);
}

function visitSegments(
    host: unknown,
    segments: readonly OptionsPathSegment[],
    index: number,
    location: string,
    visit: OptionsPathVisitor
): void {
    if (!isObject(host)) return;

    const { key, each } = segments[index];
    const keyLocation = location === '' ? key : `${location}.${key}`;
    if (index === segments.length - 1) {
        visit(host, key, keyLocation);
        return;
    }

    const next = host[key];
    if (!each) {
        visitSegments(next, segments, index + 1, keyLocation, visit);
        return;
    }
    if (Array.isArray(next)) {
        for (let i = 0; i < next.length; i++) {
            visitSegments(next[i], segments, index + 1, `${keyLocation}[${i}]`, visit);
        }
    } else if (isObject(next)) {
        for (const childKey of Object.keys(next)) {
            visitSegments(next[childKey], segments, index + 1, `${keyLocation}.${childKey}`, visit);
        }
    }
}

/**
 * The value at the first of `contributions` that descends into `host` and is set on `hostOptions`
 * (one axis's or one series' options for those hosts, the chart options otherwise).
 */
export function readContributedValue(
    contributions: Iterable<ResolvedContribution>,
    host: ContributionHost,
    hostOptions: unknown
): unknown {
    let found: unknown;
    for (const contribution of contributions) {
        if (contribution.host !== host) continue;
        visitOptionsPath(hostOptions, contribution.relative, (target, key) => {
            found ??= target[key];
        });
        if (found != null) break;
    }
    return found;
}

/**
 * Whether `value` at a contributed location asks for the feature, so that an unregistered owner is
 * reported rather than silently stripped.
 */
export function isContributionRequested(contribution: OptionsContribution, value: unknown): boolean {
    if (value == null) return false;
    if (contribution.requested === 'present') return true;
    return !isObject(value) || value.enabled !== false;
}

/**
 * Returns `defs` with each contribution's `options` installed at its path, so one validation pass
 * covers module-owned locations. A contribution without `options` keeps whatever `defs` already
 * declares there, falling back to `object` so the value survives to the module that owns it. Only
 * chart-host paths apply: axis and series hosts validate against their own module defs.
 */
export function composeContributedDefs<T>(
    defs: OptionsDefs<T>,
    contributions: Iterable<ResolvedContribution>
): OptionsDefs<T> {
    let composed: Record<string, unknown> | undefined;
    for (const { contribution, path, host } of contributions) {
        if (host !== 'chart') continue;
        composed ??= { ...defs };

        let target = composed;
        const { segments } = path;
        for (let i = 0; i < segments.length - 1; i++) {
            const { key } = segments[i];
            const existing = target[key];
            const next: Record<string, unknown> = isObject(existing) && !isFunction(existing) ? { ...existing } : {};
            target[key] = next;
            target = next;
        }
        const leaf = segments.at(-1)!.key;
        target[leaf] = contribution.options ?? target[leaf] ?? object;
    }
    return (composed ?? defs) as OptionsDefs<T>;
}
