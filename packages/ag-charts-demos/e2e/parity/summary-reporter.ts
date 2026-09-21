import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { mkdirSync, rmSync, writeFileSync } from 'fs';

import { MAX_DIFF_PIXEL_RATIO } from './compare';
import {
    type ComparisonRecord,
    type ParitySummary,
    RESULTS_DIR,
    RESULT_ATTACHMENT,
    SCHEMA_VERSION,
    SUMMARY_PATH,
    comparisonKey,
} from './summary';
import { REFERENCE_URL } from './targets';

/**
 * Gathers the `parity-result` attachment each comparison test leaves and writes
 * `results/summary.json` when the run ends. A retried test overwrites its earlier record, so the
 * summary reflects the final attempt.
 */
class ParitySummaryReporter implements Reporter {
    private readonly records = new Map<string, ComparisonRecord>();

    onBegin() {
        // Artefacts from a previous run would otherwise sit beside this run's summary.
        rmSync(RESULTS_DIR, { recursive: true, force: true });
        mkdirSync(RESULTS_DIR, { recursive: true });
    }

    onTestEnd(test: TestCase, result: TestResult) {
        for (const attachment of result.attachments) {
            if (attachment.name !== RESULT_ATTACHMENT || !attachment.body) continue;
            const record = JSON.parse(attachment.body.toString('utf8')) as ComparisonRecord;
            if (!record.passed && !record.error && result.error?.message) {
                record.error = stripAnsi(result.error.message);
            }
            this.records.set(comparisonKey(record), record);
        }
    }

    onEnd(result: FullResult) {
        const comparisons = [...this.records.values()];
        const passed = comparisons.filter((record) => record.passed).length;
        const summary: ParitySummary = {
            schemaVersion: SCHEMA_VERSION,
            generatedAt: new Date().toISOString(),
            status: result.status,
            reference: { framework: 'react', baseURL: REFERENCE_URL },
            maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
            totals: { comparisons: comparisons.length, passed, failed: comparisons.length - passed },
            comparisons,
        };
        mkdirSync(RESULTS_DIR, { recursive: true });
        writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2) + '\n');
        // eslint-disable-next-line no-console
        console.log(`Parity summary: ${passed}/${comparisons.length} comparisons passed — ${SUMMARY_PATH}`);
    }

    printsToStdio() {
        return true;
    }
}

// eslint-disable-next-line no-control-regex
const stripAnsi = (text: string) => text.replace(/\u001b\[[0-9;]*m/g, '');

export default ParitySummaryReporter;
