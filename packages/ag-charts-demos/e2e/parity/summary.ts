import { resolve } from 'path';

import type { ComparisonGate } from './compare';
import { RUN_KIND, type SkippedPort } from './targets';

// The shape of the JSON summary the run leaves behind, shared by the spec that produces one
// record per attempt at a comparison and the reporter that gathers them. Documented in README.md.

/** Written under here: artefact folders per attempt and `summary.json`. Gitignored. */
export const RESULTS_DIR = resolve(__dirname, 'results', RUN_KIND);
export const SUMMARY_PATH = resolve(RESULTS_DIR, 'summary.json');

/** Name of the per-test attachment carrying a `ComparisonRecord`. */
export const RESULT_ATTACHMENT = 'parity-result';

export const SCHEMA_VERSION = 3;

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
    /**
     * Committed ports the run did not compare, in `<demo>/<framework>` order: in a discovery run,
     * the stale ones (`reason: 'stale'`), whose manifest records an older hash of the demo than
     * its current one. Empty in every other run.
     */
    skipped: SkippedPort[];
    /** Every attempt, retries and repeats included, in the order they ended. */
    comparisons: ComparisonRecord[];
}

/** `sha256-` and the first eight hex digits of a source hash; `never` for a port never aligned. */
const shortHash = (hash: string | null) =>
    hash != null && hash !== '' ? hash.slice(0, 'sha256-'.length + 8) : 'never';

/**
 * The lines the run prints about the ports it skipped, or has nothing to compare: loud on purpose,
 * since a skipped port is one the run says nothing else about.
 */
export function describeSkipped(skipped: readonly SkippedPort[], compared: number): string[] {
    const lines: string[] = [];
    if (skipped.length > 0) {
        lines.push(
            `Parity: SKIPPED ${skipped.length} stale port${skipped.length === 1 ? '' : 's'}, not compared with the React demo. ` +
                'Stale ports are expected between releases; they are aligned at the release-branch cut ' +
                '("Demo Port Alignment" workflow) or with /port-showcases.'
        );
        for (const port of skipped) {
            // The commits name the change when they differ; they do not when the demo change is not
            // committed yet, or a shallow clone cannot tell, and the hashes do.
            const { manifestCommit, sourceCommit } = port;
            const byCommit =
                manifestCommit != null &&
                manifestCommit !== '' &&
                sourceCommit != null &&
                sourceCommit !== '' &&
                manifestCommit !== sourceCommit;
            const synced = byCommit ? manifestCommit.slice(0, 8) : shortHash(port.manifestHash);
            const now = byCommit ? sourceCommit.slice(0, 8) : shortHash(port.sourceHash);
            lines.push(`  - ${port.demo}/${port.framework}: ${port.reason}, aligned to ${synced}, demo now at ${now}`);
        }
    }
    if (compared === 0) lines.push('Parity: no current ports to compare.');
    return lines;
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
