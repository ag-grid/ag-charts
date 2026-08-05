import type {
    afterAll as AfterAll,
    beforeAll as BeforeAll,
    describe as Describe,
    expect as Expect,
    it as It,
    vi as Vi,
} from 'vitest';

import { getPath, isPlainObject, objectsEqual } from 'ag-charts-core';

import type { ThemeablePath, TypeNode } from './themeable-contract';
import { themeablePaths } from './themeable-contract';

declare const vi: typeof Vi;
declare const beforeAll: typeof BeforeAll;
declare const afterAll: typeof AfterAll;
declare const describe: typeof Describe;
declare const it: typeof It;
declare const expect: typeof Expect;

type PlainObject = Record<string, any>;

export type Invariant = 'equivalence' | 'non-activation' | 'explicit-enable';

export interface Finding {
    invariant: Invariant;
    seriesType: string;
    path: string;
    detail: string;
}

/** Enumerated coverage the case is known to achieve, so a collapse fails instead of asserting less. */
export interface CoverageBounds {
    /** Lower bound on paths compared on both routes. Raise it when new themeable options land. */
    minChecked: number;
    /** Upper bound on paths the harness could supply no value for. */
    maxSkipped: number;
    /** Upper bound on paths where the value the harness supplied was refused by both routes. */
    maxRejected: number;
    /** Upper bound on paths neither route resolved the supplied value into — nothing was demonstrated. */
    maxIneffective: number;
    /** Lower bound on auto-enable containers found, so invariants B and C cannot collapse to nothing. */
    minContainers: number;
}

export interface ProvenanceCase {
    seriesType: string;
    /** Required series keys for this type, excluding `type` itself. */
    series: PlainObject;
    data: Array<PlainObject>;
    coverage: CoverageBounds;
    /** Keys of `KNOWN_ASYMMETRIES` this series is expected to exhibit — asserted exactly. */
    asymmetries?: Array<string>;
    /** Type names `ag-charts-types` does not declare structurally, so their subtree cannot be enumerated. */
    unresolved?: Array<string>;
}

/** The resolved options tree plus every value the options pipeline refused, from all of its channels. */
export interface PreparedOptions {
    options: PlainObject;
    rejections: Array<string>;
}

export interface ProvenanceContext {
    prepare: (options: unknown) => PreparedOptions;
}

export interface KnownAsymmetry {
    /** Why the divergence is tolerated. */
    reason: string;
    /** The only resolved paths allowed to differ. A divergence anywhere else is still a finding. */
    diffPaths: Array<string>;
}

/**
 * Paths where the two routes are known to diverge, with the reason each is tolerated and the exact extent of
 * the divergence. Cases declare which of these they expect, so an entry that stops occurring — or starts
 * reaching further than its reason accounts for — fails rather than quietly outliving its reason.
 */
export const KNOWN_ASYMMETRIES: Record<string, KnownAsymmetry> = {
    direction: {
        reason: 'axis assignment is derived from the raw series options before overrides merge',
        diffPaths: [
            'series.0.direction',
            'series.0.xKeyAxis',
            'series.0.yKeyAxis',
            'navigator.miniChart.series.0.direction',
            'navigator.miniChart.series.0.xKeyAxis',
            'navigator.miniChart.series.0.yKeyAxis',
        ],
    },
    grouped: {
        reason: 'series grouping is computed from the raw series options before overrides merge, so a themed value is neither applied nor stripped',
        diffPaths: ['series.0.grouped'],
    },
};

export interface ProvenanceReport {
    seriesType: string;
    findings: Array<Finding>;
    checked: number;
    /** Paths with no value the harness could legally supply — coverage loss, so callers assert a ceiling. */
    skipped: Array<string>;
    rejected: Array<string>;
    /** Paths both routes resolved back to the baseline, so the comparison proved nothing. */
    ineffective: Array<string>;
    /** Auto-enable containers invariants B and C ran over. */
    containers: number;
    /** Type names that blocked enumeration of a subtree, deduplicated. */
    unresolved: Array<string>;
    matchedAsymmetries: Set<string>;
}

function sortNames(names: Iterable<string>) {
    return [...names].sort((a, b) => a.localeCompare(b));
}

function nest(path: Array<string>, value: unknown): PlainObject {
    const root: PlainObject = {};
    let node = root;
    for (const [index, key] of path.entries()) {
        if (index === path.length - 1) node[key] = value;
        else node = node[key] = {};
    }
    return root;
}

function leafPaths(object: unknown, prefix: Array<string> = [], out: Array<Array<string>> = []) {
    if (!isPlainObject(object) && !Array.isArray(object)) return out;
    for (const key of Object.keys(object as PlainObject)) {
        const value = (object as PlainObject)[key];
        if (typeof value === 'function') continue;
        if (isPlainObject(value) || Array.isArray(value)) leafPaths(value, [...prefix, key], out);
        else out.push([...prefix, key]);
    }
    return out;
}

const COLOUR_VALUE = 'rgb(190, 55, 55)';
const STRING_VALUE = 'provenance';

function literalOf(type: string) {
    return /^'.*'$/.test(type) ? type.replace(/(?:^')|(?:'$)/g, '') : undefined;
}

/**
 * The legal range an alias name carries but its structural type does not — `Opacity` and `PixelSize` both
 * bottom out at `number`, and only the name says which values a validator will accept.
 */
function fromAlias(name: string): Array<unknown> {
    if (/Color/.test(name)) return [COLOUR_VALUE];
    if (/^(Opacity|Ratio)$/.test(name)) return [0.5, 0.25];
    if (/^(PixelSize|FontSize|DurationMs|Degrees)$/.test(name)) return [7, 4];
    if (name === 'FontFamily') return ['Verdana, sans-serif'];
    if (name === 'FontStyle') return ['italic'];
    if (name === 'FontWeight') return ['bold'];
    return [];
}

/**
 * Legal values for a structural type, ignoring `current`. Unions offer every branch so a literal matching the
 * resolved default does not consume the whole union; `candidateValue` picks the first that differs.
 */
function fromTypeNode(type: TypeNode): Array<unknown> {
    if (typeof type === 'string') {
        const literal = literalOf(type);
        if (literal != null) return [literal];
        if (type === 'boolean') return [true, false];
        if (type === 'number') return [7, 4];
        if (type === 'string') return [STRING_VALUE];
        return [];
    }

    if (typeof type !== 'object') return [];

    if (type.kind === 'union') {
        return type.type.flatMap(fromTypeNode);
    }

    if (type.kind === 'array') {
        const [element] = fromTypeNode(type.type);
        if (element === undefined) return [];
        return [typeof element === 'number' ? [element, element + 2] : [element]];
    }

    return [];
}

function perturb(current: unknown): unknown {
    if (typeof current === 'boolean') return !current;
    if (typeof current === 'number') {
        if (current > 0 && current <= 1) return current === 0.5 ? 0.25 : 0.5;
        return current + 3;
    }
    if (typeof current === 'string' && /^(#|rgb)/.test(current)) {
        return current === COLOUR_VALUE ? 'rgb(55, 90, 190)' : COLOUR_VALUE;
    }
    return undefined;
}

/**
 * A legal value differing from the resolved default. Alias names come first because they narrow the legal
 * range; the structural type covers options with no default, and perturbation is the last resort for types
 * the harness cannot interpret.
 */
function candidateValue({ type, aliases }: ThemeablePath, current: unknown): unknown {
    const candidates = [...aliases.flatMap(fromAlias), ...fromTypeNode(type), perturb(current)];
    for (const candidate of candidates) {
        if (candidate === undefined) continue;
        if (!objectsEqual(candidate, current)) return candidate;
    }
    return undefined;
}

interface Divergence {
    path: string;
    detail: string;
}

function diffTrees(a: unknown, b: unknown): Array<Divergence> {
    const paths = new Map<string, Array<string>>();
    for (const path of [...leafPaths(a), ...leafPaths(b)]) paths.set(path.join('.'), path);

    const diffs: Array<Divergence> = [];
    for (const [key, path] of paths) {
        const left = getPath(a as object, path);
        const right = getPath(b as object, path);
        if (!objectsEqual(left, right)) {
            diffs.push({ path: key, detail: `${key}: user=${format(left)} override=${format(right)}` });
        }
    }
    return diffs;
}

function format(value: unknown) {
    if (typeof value === 'bigint') return `${value}n`;
    return JSON.stringify(value) ?? String(value);
}

/** `enabled: false` prunes the surrounding config, so an absent container reads as disabled. */
function enabledState(resolved: unknown, container: Array<string>) {
    const value = getPath(resolved as object, [...container, 'enabled']);
    return value === undefined ? false : value;
}

function buildOptions(testCase: ProvenanceCase, seriesPatch?: PlainObject, overridePatch?: PlainObject) {
    const options: PlainObject = {
        data: testCase.data,
        series: [{ type: testCase.seriesType, ...testCase.series, ...seriesPatch }],
    };
    if (overridePatch) {
        options['theme'] = { overrides: { [testCase.seriesType]: { series: overridePatch } } };
    }
    return options;
}

/**
 * The whole resolved tree, so a divergence in a conditional default anywhere is caught and not just the value
 * itself. `theme` is dropped because the two routes differ there by construction — that is the input, not the
 * outcome.
 */
function resolve(ctx: ProvenanceContext, options: PlainObject) {
    const { options: resolved, rejections } = ctx.prepare(options);
    const { theme: _theme, ...comparable } = resolved;
    return { tree: comparable, rejections };
}

/**
 * Invariant A: a themeable value supplied through `theme.overrides` must resolve identically to the same
 * value supplied in user options. Container `enabled` keys are governed by invariants B and C.
 */
function checkEquivalence(
    ctx: ProvenanceContext,
    testCase: ProvenanceCase,
    paths: Array<ThemeablePath>,
    baseline: PlainObject
) {
    const { seriesType } = testCase;
    const findings: Array<Finding> = [];
    const skipped: Array<string> = [];
    const rejected: Array<string> = [];
    const ineffective: Array<string> = [];
    const matchedAsymmetries = new Set<string>();
    let checked = 0;

    for (const themeablePath of paths) {
        const { path } = themeablePath;
        if (path.at(-1) === 'enabled') continue;

        const pathKey = path.join('.');
        const seriesPath = ['series', '0', ...path];
        const current = getPath(baseline, seriesPath);
        const value = candidateValue(themeablePath, current);
        if (value === undefined) {
            skipped.push(pathKey);
            continue;
        }

        const viaUser = resolve(ctx, buildOptions(testCase, nest(path, value)));
        const viaOverride = resolve(ctx, buildOptions(testCase, undefined, nest(path, value)));

        // A value both routes reject is the harness supplying something illegal, not a provenance defect.
        if (viaUser.rejections.length > 0 && viaOverride.rejections.length > 0) {
            rejected.push(`${pathKey}=${format(value)}: ${viaUser.rejections[0]}`);
            continue;
        }

        // `candidateValue` guarantees the value differs from the baseline, so a route still resolving the
        // baseline never applied it. Comparing two such routes compares the baseline with itself.
        const landedViaUser = !objectsEqual(getPath(viaUser.tree, seriesPath), current);
        const landedViaOverride = !objectsEqual(getPath(viaOverride.tree, seriesPath), current);
        if (!landedViaUser && !landedViaOverride) {
            // A value neither route applied cannot violate an invariant about resolved values, so a warning
            // from only one of them is recorded rather than reported — it is a diagnostic gap, not a defect.
            const oneSided = viaUser.rejections.length !== viaOverride.rejections.length;
            ineffective.push(oneSided ? `${pathKey} (warned on one route only)` : pathKey);
            continue;
        }

        checked++;

        const diffs = diffTrees(viaUser.tree, viaOverride.tree).filter((diff) => !/(^|\.)enabled$/.test(diff.path));
        const known = KNOWN_ASYMMETRIES[pathKey];
        const unexplained = known == null ? diffs : diffs.filter((diff) => !known.diffPaths.includes(diff.path));

        if (known != null && diffs.length > 0 && unexplained.length === 0) {
            matchedAsymmetries.add(pathKey);
        } else if (unexplained.length > 0) {
            findings.push({
                invariant: 'equivalence',
                seriesType,
                path: pathKey,
                detail: `set ${format(value)} -> ${unexplained.map(({ detail }) => detail).join(' | ')}`,
            });
        }

        // The value landed somewhere, so a refusal from only one route is a genuine divergence.
        for (const rejection of [...viaUser.rejections, ...viaOverride.rejections]) {
            findings.push({
                invariant: 'equivalence',
                seriesType,
                path: pathKey,
                detail: `accepted on one route only: ${rejection}`,
            });
        }
    }

    return { findings, checked, skipped, rejected, ineffective, matchedAsymmetries };
}

function autoEnableContainers(baseline: unknown) {
    return leafPaths(baseline)
        .filter((path) => path.at(-1) === 'enabled' && path.length > 1)
        .map((path) => path.slice(0, -1));
}

/** The first non-`enabled` leaf option declared directly on a container, used to probe its enablement. */
function containerSubPath(paths: Array<ThemeablePath>, container: Array<string>) {
    return paths.find(({ path }) => {
        if (path.length !== container.length + 1 || path.at(-1) === 'enabled') return false;
        return container.every((segment, index) => path[index] === segment);
    });
}

/**
 * Invariant B: for standalone charts a styling value arriving through `theme.overrides` must not switch a
 * feature on. Themes style; they do not activate.
 */
function checkNonActivation(
    ctx: ProvenanceContext,
    testCase: ProvenanceCase,
    paths: Array<ThemeablePath>,
    series: PlainObject | undefined,
    containers: Array<Array<string>>
) {
    const { seriesType } = testCase;
    const findings: Array<Finding> = [];

    for (const container of containers) {
        if (enabledState(series, container) !== false) continue;

        const key = container.join('.');
        const subPath = containerSubPath(paths, container);
        if (subPath == null) continue;

        const value = candidateValue(subPath, getPath(series, subPath.path));
        if (value === undefined) continue;

        const viaOverride = resolve(ctx, buildOptions(testCase, undefined, nest(subPath.path, value)));
        if (viaOverride.rejections.length > 0) continue;

        if (enabledState(viaOverride.tree['series']?.[0], container) !== false) {
            findings.push({
                invariant: 'non-activation',
                seriesType,
                path: key,
                detail: `overriding ${subPath.path.join('.')} activated ${key}`,
            });
        }
    }

    return findings;
}

/**
 * Invariant C: an `enabled` value set in `theme.overrides` is always honoured. Integrated charts configure
 * exclusively through overrides, and mark theme-owned containers with `_enabledFromTheme` so that a user
 * sub-option cannot infer enablement over the theme's decision.
 */
function checkExplicitEnable(
    ctx: ProvenanceContext,
    testCase: ProvenanceCase,
    paths: Array<ThemeablePath>,
    series: PlainObject | undefined,
    containers: Array<Array<string>>
) {
    const { seriesType } = testCase;
    const findings: Array<Finding> = [];

    for (const container of containers) {
        const key = container.join('.');

        for (const enabled of [true, false]) {
            const viaOverride = resolve(
                ctx,
                buildOptions(testCase, undefined, nest([...container, 'enabled'], enabled))
            );
            if (viaOverride.rejections.length > 0) continue;

            const resolvedEnabled = enabledState(viaOverride.tree['series']?.[0], container);
            if (resolvedEnabled !== enabled) {
                findings.push({
                    invariant: 'explicit-enable',
                    seriesType,
                    path: key,
                    detail: `overrides set enabled=${enabled}, resolved ${resolvedEnabled}`,
                });
            }
        }

        const subPath = containerSubPath(paths, container);
        if (subPath == null) continue;

        const value = candidateValue(subPath, getPath(series, subPath.path));
        if (value === undefined) continue;

        // The integrated shape: the theme owns `enabled`, so a user sub-option must not auto-enable it.
        const themeOwned = nest(container, { enabled: false, _enabledFromTheme: true });
        const viaUser = resolve(ctx, buildOptions(testCase, nest(subPath.path, value), themeOwned));
        if (viaUser.rejections.length > 0) continue;

        if (enabledState(viaUser.tree['series']?.[0], container) !== false) {
            findings.push({
                invariant: 'explicit-enable',
                seriesType,
                path: key,
                detail: `_enabledFromTheme container activated by user option ${subPath.path.join('.')}`,
            });
        }
    }

    return findings;
}

export function runProvenanceChecks(ctx: ProvenanceContext, testCase: ProvenanceCase): ProvenanceReport {
    const paths = themeablePaths(testCase.seriesType);
    const { tree: baseline } = resolve(ctx, buildOptions(testCase));
    const series = baseline['series']?.[0];
    const containers = autoEnableContainers(series);
    const equivalence = checkEquivalence(ctx, testCase, paths, baseline);

    return {
        seriesType: testCase.seriesType,
        checked: equivalence.checked,
        skipped: equivalence.skipped,
        rejected: equivalence.rejected,
        ineffective: equivalence.ineffective,
        containers: containers.length,
        unresolved: sortNames(new Set(paths.flatMap(({ unresolved }) => unresolved ?? []))),
        matchedAsymmetries: equivalence.matchedAsymmetries,
        findings: [
            ...equivalence.findings,
            ...checkNonActivation(ctx, testCase, paths, series, containers),
            ...checkExplicitEnable(ctx, testCase, paths, series, containers),
        ],
    };
}

/** Resolves user options through the options graph, reporting whatever the pipeline refused. */
export type OptionsPreparer = (options: unknown) => {
    processedOptions: PlainObject;
    validationIssues: ReadonlyArray<{ severity: string; message: string }>;
};

/**
 * Option validation reports a rejected value three ways: a structured issue list, `console.warn`, and
 * `console.error` — the module gate reports through the last of these only. All are read, because none is
 * complete on its own, and dev mode is switched on for the suite since a chunk of the option-graph warnings
 * are gated behind it and would otherwise leave an illegal value looking legal.
 */
export function setupProvenanceContext(prepare: OptionsPreparer): ProvenanceContext {
    const logged: Array<string> = [];
    const spies: Array<{ mockRestore: () => void }> = [];
    let previousDebug: unknown;

    beforeAll(() => {
        previousDebug = (globalThis as PlainObject)['agChartsDebug'];
        (globalThis as PlainObject)['agChartsDebug'] = ['dev'];
        const capture = (...args: Array<unknown>) => {
            logged.push(args.map(String).join(' '));
        };
        spies.push(vi.spyOn(console, 'warn').mockImplementation(capture));
        spies.push(vi.spyOn(console, 'error').mockImplementation(capture));
    });

    afterAll(() => {
        for (const spy of spies) spy.mockRestore();
        (globalThis as PlainObject)['agChartsDebug'] = previousDebug;
    });

    return {
        prepare: (options: unknown) => {
            logged.length = 0;
            const { processedOptions, validationIssues } = prepare(options);
            return {
                options: processedOptions,
                rejections: [
                    ...validationIssues.map(({ severity, message }) => `${severity}: ${message}`),
                    ...logged.splice(0, logged.length),
                ],
            };
        },
    };
}

export function formatFindings(findings: Array<Finding>) {
    return findings.map((f) => `  [${f.invariant}] ${f.seriesType}.${f.path}: ${f.detail}`).join('\n');
}

export function defineProvenanceSuite(prepare: OptionsPreparer, cases: Array<ProvenanceCase>) {
    describe('theme override provenance', () => {
        const ctx = setupProvenanceContext(prepare);

        it.each(cases)('$seriesType resolves theme overrides as user options', (testCase) => {
            const report = runProvenanceChecks(ctx, testCase);

            console.info(
                `[${report.seriesType}] checked=${report.checked} skipped=${report.skipped.length} ` +
                    `rejected=${report.rejected.length} containers=${report.containers} ` +
                    `findings=${report.findings.length} unresolved=[${report.unresolved}] ` +
                    `asymmetries=[${[...report.matchedAsymmetries]}]\n` +
                    // Listed rather than counted: which options prove nothing is the part worth auditing.
                    `  ineffective(${report.ineffective.length})=[${report.ineffective}]`
            );

            expect(formatFindings(report.findings)).toBe('');

            // Coverage is asserted per case, so a collapse in what the harness can supply fails here rather
            // than silently reducing the suite to a handful of paths.
            expect(report.checked).toBeGreaterThanOrEqual(testCase.coverage.minChecked);
            expect(report.skipped.length).toBeLessThanOrEqual(testCase.coverage.maxSkipped);
            expect(report.rejected.length).toBeLessThanOrEqual(testCase.coverage.maxRejected);
            expect(report.ineffective.length).toBeLessThanOrEqual(testCase.coverage.maxIneffective);
            expect(report.containers).toBeGreaterThanOrEqual(testCase.coverage.minContainers);
            expect(report.unresolved).toEqual(testCase.unresolved ?? []);

            const describeEntry = (path: string) => `${path} (${KNOWN_ASYMMETRIES[path]?.reason})`;
            expect(sortNames(report.matchedAsymmetries).map(describeEntry)).toEqual(
                sortNames(testCase.asymmetries ?? []).map(describeEntry)
            );
        });
    });
}
