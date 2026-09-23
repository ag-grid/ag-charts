import { resolve } from 'path';

import type { ComparisonGate } from './compare';
import { RUN_KIND } from './targets';

// The shape of the JSON summary the run leaves behind, shared by the spec that produces one
// record per attempt at a comparison and the reporter that gathers them. Documented in README.md.

/** Written under here: artefact folders per attempt and `summary.json`. Gitignored. */
export const RESULTS_DIR = resolve(__dirname, 'results', RUN_KIND);
export const SUMMARY_PATH = resolve(RESULTS_DIR, 'summary.json');

/** Name of the per-test attachment carrying a `ComparisonRecord`. */
export const RESULT_ATTACHMENT = 'parity-result';

export const SCHEMA_VERSION = 2;

export interface ComparisonArtefacts {
    /** Paths relative to the results directory. Present only when written (failure, or PARITY_KEEP_ARTEFACTS=1). */
    reference?: string;
    port?: string;
    diff?: string;
    sideBySide?: string;
}

export interface ComparisonRecord {
    demo: string;
    framework: string;
    state: string;
    /** `<width>x<height>` of the viewport the page is first laid out in. */
    viewport: string;
    /** Playwright's repeat index: 0 unless the run passes `--repeat-each`. */
    repeatEachIndex: number;
    /** Playwright's retry index: 0 for the first attempt. */
    retry: number;
    /** `<width>x<height>` of each screenshot once taken: the viewport grown to that side's content. */
    screenshots: { reference: string; port: string } | null;
    /** Null when the comparison never happened (the state was not reached on one side). */
    diffPixels: number | null;
    diffPixelRatio: number | null;
    passed: boolean;
    artefacts: ComparisonArtefacts;
    /** Why the attempt did not pass, when it did not. */
    error?: string;
}

/** A comparison's outcome over its attempts: `flaky` when it failed first and passed on a retry. */
export type ComparisonOutcome = 'passed' | 'flaky' | 'failed';

export interface ParitySummary {
    schemaVersion: typeof SCHEMA_VERSION;
    generatedAt: string;
    /** Overall run status as Playwright reports it. */
    status: 'passed' | 'failed' | 'timedout' | 'interrupted';
    /** `self-parity` compares the React app with itself; `ports` compares the ports with it. */
    run: typeof RUN_KIND;
    reference: { framework: 'react'; baseURL: string };
    /** Gate applied to every comparison. */
    gate: ComparisonGate;
    /**
     * A comparison is one `framework/demo/state@viewport` at one repeat index, counted once by its
     * outcome over its attempts. `attempts` counts every record in `comparisons`.
     */
    totals: { comparisons: number; passed: number; flaky: number; failed: number; attempts: number };
    /** Every attempt, retries and repeats included, in the order they ended. */
    comparisons: ComparisonRecord[];
}

type ComparisonIdentity = Pick<ComparisonRecord, 'framework' | 'demo' | 'state' | 'viewport'>;
type AttemptIdentity = ComparisonIdentity & Pick<ComparisonRecord, 'repeatEachIndex' | 'retry'>;

/** `framework/demo/state@viewport`: what is compared, whatever the repeat or attempt. */
export const comparisonKey = (record: ComparisonIdentity) =>
    `${record.framework}/${record.demo}/${record.state}@${record.viewport}`;

/** One repeat of a comparison: the unit that passes, fails or is flaky. */
const repeatKey = (record: ComparisonIdentity & Pick<ComparisonRecord, 'repeatEachIndex'>) =>
    `${comparisonKey(record)}#${record.repeatEachIndex}`;

/** One attempt at a comparison; every attempt has its own record and its own artefact folder. */
export const attemptKey = (record: AttemptIdentity) => `${repeatKey(record)}.${record.retry}`;

/** The artefact folder of an attempt, relative to the results directory. */
export const attemptDir = (record: AttemptIdentity) =>
    `${comparisonKey(record)}/repeat-${record.repeatEachIndex}-retry-${record.retry}`;

/** Totals over every attempt: each repeat of a comparison counts once, by how its attempts went. */
export function summariseAttempts(records: readonly ComparisonRecord[]): ParitySummary['totals'] {
    const attemptsByRepeat = new Map<string, ComparisonRecord[]>();
    for (const record of records) {
        const key = repeatKey(record);
        attemptsByRepeat.set(key, [...(attemptsByRepeat.get(key) ?? []), record]);
    }
    const totals = { comparisons: attemptsByRepeat.size, passed: 0, flaky: 0, failed: 0, attempts: records.length };
    for (const attempts of attemptsByRepeat.values()) {
        totals[outcomeOf(attempts)]++;
    }
    return totals;
}

function outcomeOf(attempts: readonly ComparisonRecord[]): ComparisonOutcome {
    const last = attempts.reduce((latest, attempt) => (attempt.retry > latest.retry ? attempt : latest));
    if (!last.passed) return 'failed';
    return attempts.every((attempt) => attempt.passed) ? 'passed' : 'flaky';
}
