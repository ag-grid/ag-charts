import { resolve } from 'path';

// The shape of the JSON summary the run leaves behind, shared by the spec that produces one
// record per comparison and the reporter that gathers them. Documented in README.md.

/** Written under here: artefact folders per comparison and `summary.json`. Gitignored. */
export const RESULTS_DIR = resolve(__dirname, 'results');
export const SUMMARY_PATH = resolve(RESULTS_DIR, 'summary.json');

/** Name of the per-test attachment carrying a `ComparisonRecord`. */
export const RESULT_ATTACHMENT = 'parity-result';

export const SCHEMA_VERSION = 1;

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
    /** `<width>x<height>` of the viewport. */
    viewport: string;
    /** Null when the comparison never happened (the state was not reached on one side). */
    diffPixels: number | null;
    diffPixelRatio: number | null;
    passed: boolean;
    artefacts: ComparisonArtefacts;
    /** Why the comparison did not pass, when it did not. */
    error?: string;
}

export interface ParitySummary {
    schemaVersion: typeof SCHEMA_VERSION;
    generatedAt: string;
    /** Overall run status as Playwright reports it. */
    status: 'passed' | 'failed' | 'timedout' | 'interrupted';
    reference: { framework: 'react'; baseURL: string };
    /** Gate applied to every comparison. */
    maxDiffPixelRatio: number;
    totals: { comparisons: number; passed: number; failed: number };
    comparisons: ComparisonRecord[];
}

export const comparisonKey = (record: Pick<ComparisonRecord, 'framework' | 'demo' | 'state' | 'viewport'>) =>
    `${record.framework}/${record.demo}/${record.state}@${record.viewport}`;
