import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import { type AxeExampleResult, groupAxeResults, renderAxeReportHtml } from '../../scripts/a11y/axe-report';

const REPORT_DIR = resolve(__dirname, '../../../../reports/a11y');

export default class AxeReporter implements Reporter {
    private readonly results = new Map<string, AxeExampleResult>();

    onTestEnd(test: TestCase, result: TestResult) {
        for (const attachment of result.attachments) {
            if (attachment.name !== 'axe-results' || attachment.body == null) continue;
            this.results.set(test.id, JSON.parse(attachment.body.toString('utf-8')));
        }
    }

    onEnd() {
        if (this.results.size === 0) return;

        const report = groupAxeResults(Array.from(this.results.values()));
        mkdirSync(REPORT_DIR, { recursive: true });
        writeFileSync(join(REPORT_DIR, 'axe-report.json'), JSON.stringify(report, null, 2));
        writeFileSync(join(REPORT_DIR, 'axe-report.html'), renderAxeReportHtml(report));

        // eslint-disable-next-line no-console
        console.log(
            `axe: ${report.rules.length} rules violated across ${report.examplesScanned} examples (${report.scanErrors.length} scan errors) - ${REPORT_DIR}`
        );
    }
}
