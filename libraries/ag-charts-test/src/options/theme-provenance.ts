import type {
    afterAll as AfterAll,
    beforeAll as BeforeAll,
    describe as Describe,
    expect as Expect,
    it as It,
    vi as Vi,
} from 'vitest';

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

export interface ProvenanceCase {
    seriesType: string;
    /** Required series keys for this type, excluding `type` itself. */
    series: PlainObject;
    data: Array<PlainObject>;
}

export interface ProvenanceContext {
    prepareOptions: (options: unknown) => PlainObject;
    /** Drains warnings emitted since the last call, so invalid candidate values can be skipped. */
    takeWarnings: () => Array<string>;
}

/**
 * Paths where the two routes are known to diverge, with the reason each is tolerated. Suites declare which of
 * these they expect to observe, so an entry that stops occurring — or starts occurring somewhere new — fails
 * rather than quietly outliving its reason.
 */
export const KNOWN_ASYMMETRIES: Record<string, string> = {
    direction: 'axis assignment is derived from the raw series options before overrides merge',
    grouped:
        'series grouping is computed from the raw series options before overrides merge, so a themed value is neither applied nor stripped',
};

export interface ProvenanceReport {
    seriesType: string;
    findings: Array<Finding>;
    checked: number;
    /** Paths with no value the harness could legally supply — coverage loss, so callers assert a ceiling. */
    skipped: Array<string>;
    rejected: Array<string>;
    matchedAsymmetries: Set<string>;
}

function isPlainObject(value: unknown): value is PlainObject {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function getPath(object: unknown, path: Array<string>) {
    return path.reduce<any>((node, key) => node?.[key], object);
}

function nest(path: Array<string>, value: unknown): PlainObject {
    const root: PlainObject = {};
    let node = root;
    path.forEach((key, index) => {
        if (index === path.length - 1) node[key] = value;
        else node = node[key] = {};
    });
    return root;
}

function leafPaths(object: unknown, prefix: Array<string> = [], out: Array<Array<string>> = []) {
    if (!isPlainObject(object)) return out;
    for (const [key, value] of Object.entries(object)) {
        if (typeof value === 'function') continue;
        if (isPlainObject(value)) leafPaths(value, [...prefix, key], out);
        else out.push([...prefix, key]);
    }
    return out;
}

const COLOUR_VALUE = 'rgb(190, 55, 55)';

function fromTypeNode(type: TypeNode): unknown {
    if (typeof type === 'string') {
        if (type === 'boolean') return true;
        if (/Color/.test(type)) return COLOUR_VALUE;
        if (/^(Opacity|Ratio)$/.test(type)) return 0.5;
        if (/^(PixelSize|FontSize|DurationMs|Degrees|number)$/.test(type)) return 7;
        if (type === 'FontFamily') return 'Verdana, sans-serif';
        if (type === 'FontStyle') return 'italic';
        if (type === 'FontWeight') return 'bold';
        return undefined;
    }

    if (isPlainObject(type) && type.kind === 'union' && Array.isArray(type.type)) {
        for (const branch of type.type) {
            if (typeof branch === 'string' && /^'.*'$/.test(branch)) return branch.replace(/^'|'$/g, '');
        }
    }

    return undefined;
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
 * A legal value differing from the resolved default. Type-derived first so options with no default are
 * still covered; perturbation of the default is the fallback for types the harness cannot interpret.
 */
function candidateValue(type: TypeNode, current: unknown): unknown {
    const candidates = [fromTypeNode(type), perturb(current)];
    for (const candidate of candidates) {
        if (candidate === undefined) continue;
        if (JSON.stringify(candidate) !== JSON.stringify(current)) return candidate;
    }
    if (typeof current === 'boolean') return !current;
    return undefined;
}

function diffPaths(a: unknown, b: unknown) {
    const paths = new Map<string, Array<string>>();
    for (const path of [...leafPaths(a), ...leafPaths(b)]) paths.set(path.join('.'), path);

    const diffs: Array<string> = [];
    for (const path of paths.values()) {
        const left = getPath(a, path);
        const right = getPath(b, path);
        if (JSON.stringify(left) !== JSON.stringify(right)) {
            diffs.push(`${path.join('.')}: user=${JSON.stringify(left)} override=${JSON.stringify(right)}`);
        }
    }
    return diffs;
}

/** `enabled: false` prunes the surrounding config, so an absent container reads as disabled. */
function enabledState(resolved: unknown, container: Array<string>) {
    const value = getPath(resolved, [...container, 'enabled']);
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

function resolveSeries(ctx: ProvenanceContext, options: PlainObject) {
    const resolved = ctx.prepareOptions(options);
    return resolved['series']?.[0];
}

/**
 * Invariant A: a themeable value supplied through `theme.overrides` must resolve identically to the same
 * value supplied in user options — across the whole resolved tree, so divergent conditional defaults are
 * caught and not just the value itself. Container `enabled` keys are governed by invariants B and C.
 */
function checkEquivalence(ctx: ProvenanceContext, testCase: ProvenanceCase, paths: Array<ThemeablePath>) {
    const { seriesType } = testCase;
    const findings: Array<Finding> = [];
    const skipped: Array<string> = [];
    const rejected: Array<string> = [];
    const matchedAsymmetries = new Set<string>();
    let checked = 0;

    const baseline = resolveSeries(ctx, buildOptions(testCase));
    ctx.takeWarnings();

    for (const { path, type } of paths) {
        if (path.at(-1) === 'enabled') continue;

        const value = candidateValue(type, getPath(baseline, path));
        if (value === undefined) {
            skipped.push(path.join('.'));
            continue;
        }

        const viaUser = resolveSeries(ctx, buildOptions(testCase, nest(path, value)));
        const userWarnings = ctx.takeWarnings();
        const viaOverride = resolveSeries(ctx, buildOptions(testCase, undefined, nest(path, value)));
        const overrideWarnings = ctx.takeWarnings();

        // A value both routes reject is the harness supplying something illegal, not a provenance defect.
        if (userWarnings.length > 0 && overrideWarnings.length > 0) {
            rejected.push(`${path.join('.')}=${JSON.stringify(value)}: ${userWarnings[0]}`);
            continue;
        }

        checked++;

        const diffs = diffPaths(viaUser, viaOverride).filter((diff) => !/(^|\.)enabled:/.test(diff));
        const pathKey = path.join('.');
        if (diffs.length > 0 && KNOWN_ASYMMETRIES[pathKey] != null) {
            matchedAsymmetries.add(pathKey);
        } else if (diffs.length > 0) {
            findings.push({
                invariant: 'equivalence',
                seriesType,
                path: path.join('.'),
                detail: `set ${JSON.stringify(value)} -> ${diffs.join(' | ')}`,
            });
        }

        for (const warning of [...userWarnings, ...overrideWarnings]) {
            findings.push({
                invariant: 'equivalence',
                seriesType,
                path: path.join('.'),
                detail: `accepted on one route only: ${warning}`,
            });
        }
    }

    return { findings, checked, skipped, rejected, matchedAsymmetries };
}

function autoEnableContainers(baseline: unknown) {
    return leafPaths(baseline)
        .filter((path) => path.at(-1) === 'enabled' && path.length > 1)
        .map((path) => path.slice(0, -1));
}

/**
 * Invariant B: for standalone charts a styling value arriving through `theme.overrides` must not switch a
 * feature on. Themes style; they do not activate.
 */
function checkNonActivation(ctx: ProvenanceContext, testCase: ProvenanceCase, paths: Array<ThemeablePath>) {
    const { seriesType } = testCase;
    const findings: Array<Finding> = [];
    const baseline = resolveSeries(ctx, buildOptions(testCase));
    ctx.takeWarnings();

    for (const container of autoEnableContainers(baseline)) {
        const baselineEnabled = enabledState(baseline, container);
        if (baselineEnabled !== false) continue;

        const key = container.join('.');
        const subPath = paths.find(({ path }) => {
            if (path.length !== container.length + 1 || path.at(-1) === 'enabled') return false;
            return container.every((segment, index) => path[index] === segment);
        });
        if (subPath == null) continue;

        const value = candidateValue(subPath.type, getPath(baseline, subPath.path));
        if (value === undefined) continue;

        const viaOverride = resolveSeries(ctx, buildOptions(testCase, undefined, nest(subPath.path, value)));
        if (ctx.takeWarnings().length > 0) continue;

        if (enabledState(viaOverride, container) !== false) {
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
function checkExplicitEnable(ctx: ProvenanceContext, testCase: ProvenanceCase, paths: Array<ThemeablePath>) {
    const { seriesType } = testCase;
    const findings: Array<Finding> = [];
    const baseline = resolveSeries(ctx, buildOptions(testCase));
    ctx.takeWarnings();

    for (const container of autoEnableContainers(baseline)) {
        const key = container.join('.');

        for (const enabled of [true, false]) {
            const viaOverride = resolveSeries(
                ctx,
                buildOptions(testCase, undefined, nest([...container, 'enabled'], enabled))
            );
            if (ctx.takeWarnings().length > 0) continue;

            if (enabledState(viaOverride, container) !== enabled) {
                findings.push({
                    invariant: 'explicit-enable',
                    seriesType,
                    path: key,
                    detail: `overrides set enabled=${enabled}, resolved ${enabledState(viaOverride, container)}`,
                });
            }
        }

        const subPath = paths.find(({ path }) => {
            if (path.length !== container.length + 1 || path.at(-1) === 'enabled') return false;
            return container.every((segment, index) => path[index] === segment);
        });
        if (subPath == null) continue;

        const value = candidateValue(subPath.type, getPath(baseline, subPath.path));
        if (value === undefined) continue;

        // The integrated shape: the theme owns `enabled`, so a user sub-option must not auto-enable it.
        const themeOwned = nest(container, { enabled: false, _enabledFromTheme: true });
        const viaUser = resolveSeries(ctx, buildOptions(testCase, nest(subPath.path, value), themeOwned));
        if (ctx.takeWarnings().length > 0) continue;

        if (enabledState(viaUser, container) !== false) {
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
    const equivalence = checkEquivalence(ctx, testCase, paths);

    return {
        seriesType: testCase.seriesType,
        checked: equivalence.checked,
        skipped: equivalence.skipped,
        rejected: equivalence.rejected,
        matchedAsymmetries: equivalence.matchedAsymmetries,
        findings: [
            ...equivalence.findings,
            ...checkNonActivation(ctx, testCase, paths),
            ...checkExplicitEnable(ctx, testCase, paths),
        ],
    };
}

/**
 * Option validation reports rejected values through `console.warn`, which the harness reads to tell an illegal
 * candidate value apart from a provenance defect.
 */
export function setupProvenanceContext(prepareOptions: (options: unknown) => PlainObject): ProvenanceContext {
    const warnings: Array<string> = [];
    let warnSpy: { mockRestore: () => void } | undefined;

    beforeAll(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: Array<unknown>) => {
            warnings.push(args.map(String).join(' '));
        });
    });

    afterAll(() => {
        warnSpy?.mockRestore();
    });

    return { prepareOptions, takeWarnings: () => warnings.splice(0, warnings.length) };
}

export function formatFindings(findings: Array<Finding>) {
    return findings.map((f) => `  [${f.invariant}] ${f.seriesType}.${f.path}: ${f.detail}`).join('\n');
}

export function defineProvenanceSuite(
    prepareOptions: (options: unknown) => PlainObject,
    cases: Array<ProvenanceCase>,
    expectedAsymmetries: Array<string>
) {
    describe('theme override provenance', () => {
        const ctx = setupProvenanceContext(prepareOptions);
        const matched = new Set<string>();

        it.each(cases)('$seriesType resolves theme overrides as user options', (testCase) => {
            const report = runProvenanceChecks(ctx, testCase);
            report.matchedAsymmetries.forEach((entry) => matched.add(entry));

            console.info(
                `[${report.seriesType}] checked=${report.checked} skipped=${report.skipped.length} ` +
                    `rejected=${report.rejected.length} findings=${report.findings.length}`
            );

            // A collapse in enumerated coverage must fail rather than quietly assert less.
            expect(report.checked).toBeGreaterThan(0);
            expect(formatFindings(report.findings)).toBe('');
        });

        it('observes exactly the documented asymmetries', () => {
            const describeEntry = (path: string) => `${path} (${KNOWN_ASYMMETRIES[path]})`;
            expect([...matched].sort().map(describeEntry)).toEqual([...expectedAsymmetries].sort().map(describeEntry));
        });
    });
}
