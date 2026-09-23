import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { mkdirSync, rmSync, writeFileSync } from 'fs';

import {
    type ComparisonRecord,
    type ParitySummary,
    RESULTS_DIR,
    RESULT_ATTACHMENT,
    SCHEMA_VERSION,
    SUMMARY_PATH,
    attemptKey,
    summariseAttempts,
} from './summary';
import { GATE, REFERENCE_URL, RUN_KIND } from './targets';

/**
 * Gathers the `parity-result` attachment each comparison test leaves and writes
 * `results/<run>/summary.json` when the run ends. Every attempt keeps its own record, so a failure
 * followed by a passing retry, or one failing repeat among several, stays visible.
 */
class ParitySummaryReporter implements Reporter {
    private readonly records = new Map<string, ComparisonRecord>();

    onBegin() {
        // Artefacts from a previous run of this kind would otherwise sit beside this run's summary.
        rmSync(RESULTS_DIR, { recursive: true, force: true });
        mkdirSync(RESULTS_DIR, { recursive: true });
    }

    onTestEnd(_test: TestCase, result: TestResult) {
        // A test attaches its record up front and again once compared; the last one wins.
        let record: ComparisonRecord | undefined;
        for (const attachment of result.attachments) {
            if (attachment.name !== RESULT_ATTACHMENT || !attachment.body) continue;
            record = JSON.parse(attachment.body.toString('utf8')) as ComparisonRecord;
        }
        if (!record) return;
        if (result.status !== 'passed') record.passed = false;
        if (!record.passed && !record.error && result.error?.message) {
            record.error = stripAnsi(result.error.message);
        }
        this.records.set(attemptKey(record), record);
    }

    onEnd(result: FullResult) {
        const comparisons = [...this.records.values()];
        const totals = summariseAttempts(comparisons);
        const summary: ParitySummary = {
            schemaVersion: SCHEMA_VERSION,
            generatedAt: new Date().toISOString(),
            status: result.status,
            run: RUN_KIND,
            reference: { framework: 'react', baseURL: REFERENCE_URL },
            gate: GATE,
            totals,
            comparisons,
        };
        mkdirSync(RESULTS_DIR, { recursive: true });
        writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2) + '\n');
        const flaky = totals.flaky > 0 ? ` (${totals.flaky} flaky)` : '';
        // eslint-disable-next-line no-console
        console.log(
            `Parity summary (${RUN_KIND}): ${totals.passed}/${totals.comparisons} comparisons passed${flaky}, ` +
                `${totals.attempts} attempts — ${SUMMARY_PATH}`
        );
    }

    printsToStdio() {
        return true;
    }
}

// eslint-disable-next-line no-control-regex
const stripAnsi = (text: string) => text.replace(/\u001b\[[0-9;]*m/g, '');

export default ParitySummaryReporter;
