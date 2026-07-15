import { afterEach, describe, expect, test } from 'vitest';

import type { AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { Chart } from '../chart';
import {
    createChart,
    deproxy,
    expectWarningsCalls,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
} from '../test/utils';

// A single-issue misconfiguration: an invalid `strokeWidth` value on a line series. Validated
// against `lineSeriesOptionsDef` before the series is constructed, so it is captured as a
// `warning` severity issue by the shared `validations` collector (additive to the existing
// `Logger.warn` console output).
const invalidStrokeWidthOptions: AgChartOptions = {
    data: [{ x: 'a', y: 1 }],
    series: [{ type: 'line', xKey: 'x', yKey: 'y', strokeWidth: 'notanumber' as any }],
};

describe('ValidationOverlay', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('#overlayLevel threshold', () => {
        test('warning level renders the overlay with a warnings section and summary, console warning still fires', async () => {
            chart = await createChart({
                ...invalidStrokeWidthOptions,
                validations: { overlayLevel: 'warning' },
            } as AgChartOptions);

            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-validation-overlay');
            expect(overlayEl).not.toBeNull();
            expect(overlayEl!.querySelector('.ag-charts-validation-overlay__summary')?.textContent).toEqual(
                'AG Charts found 1 warning'
            );

            const warningSection = overlayEl!.querySelector('.ag-charts-validation-overlay__section--warning');
            expect(warningSection).not.toBeNull();
            expect(
                warningSection!.querySelector('.ag-charts-validation-overlay__section-heading')?.textContent
            ).toEqual('Warnings (1)');
            expect(warningSection!.querySelectorAll('.ag-charts-validation-overlay__message')).toHaveLength(1);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`series[0].strokeWidth\` cannot be set to \`"notanumber"\`; expecting a number greater than or equal to 0, ignoring.",
  ],
]
`);
        });

        test('none level (default) renders no overlay, matching today’s behaviour; console warning still fires', async () => {
            chart = await createChart(invalidStrokeWidthOptions);

            expect(chart.ctx.agDocument.body.querySelector('.ag-charts-validation-overlay')).toBeNull();

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`series[0].strokeWidth\` cannot be set to \`"notanumber"\`; expecting a number greater than or equal to 0, ignoring.",
  ],
]
`);
        });

        test('error level excludes a warning-severity issue, so no overlay is rendered', async () => {
            chart = await createChart({
                ...invalidStrokeWidthOptions,
                validations: { overlayLevel: 'error' },
            } as AgChartOptions);

            expect(chart.ctx.agDocument.body.querySelector('.ag-charts-validation-overlay')).toBeNull();

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`series[0].strokeWidth\` cannot be set to \`"notanumber"\`; expecting a number greater than or equal to 0, ignoring.",
  ],
]
`);
        });
    });

    describe('#strict priority', () => {
        test('validation overlay suppresses the no-data overlay while shown', async () => {
            chart = await createChart({
                ...invalidStrokeWidthOptions,
                data: [],
                validations: { overlayLevel: 'warning' },
            } as AgChartOptions);

            expect(chart.ctx.agDocument.body.querySelector('.ag-charts-validation-overlay')).not.toBeNull();
            expect(chart.ctx.agDocument.body.querySelector('.ag-charts-no-data-overlay')).toBeNull();

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`series[0].strokeWidth\` cannot be set to \`"notanumber"\`; expecting a number greater than or equal to 0, ignoring.",
  ],
]
`);
        });
    });

    describe('#dismiss', () => {
        // Assert on `aria-hidden` rather than DOM presence: hideOverlay clears content via
        // `innerText = '\xA0'`, which jsdom does not apply to descendant nodes (real browsers do),
        // so the child element can linger in jsdom while `aria-hidden` stays correct.
        test('dismiss hides the overlay; a subsequent different issue re-shows it', async () => {
            const options = prepareTestOptions({
                ...invalidStrokeWidthOptions,
                validations: { overlayLevel: 'warning' },
            } as AgChartOptions);
            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            await chart.waitForUpdate(5000, true);

            expect(chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.getAttribute('aria-hidden')).toEqual(
                'false'
            );

            // Animations default to a real (non-instant) duration once a batch has run; skip the
            // current batch so the removal animation's cleanup runs synchronously.
            chart.skipAnimations();
            chart.validationCollector.dismiss();
            expect(chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.getAttribute('aria-hidden')).toEqual(
                'true'
            );

            await proxy.update({
                ...options,
                series: [{ type: 'line', xKey: 'x', yKey: 'y', lineDashOffset: 'alsobad' as any }],
            } as AgChartOptions);
            await chart.waitForUpdate(5000, true);

            expect(chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.getAttribute('aria-hidden')).toEqual(
                'false'
            );
            const messages = Array.from(
                chart.ctx.agDocument.body.querySelectorAll('.ag-charts-validation-overlay__message')
            ).map((el) => el.textContent);
            expect(messages.some((message) => message?.includes('series[0].lineDashOffset'))).toBe(true);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`series[0].strokeWidth\` cannot be set to \`"notanumber"\`; expecting a number greater than or equal to 0, ignoring.",
  ],
  [
    "AG Charts - Option \`series[0].lineDashOffset\` cannot be set to \`"alsobad"\`; expecting a number, ignoring.",
  ],
]
`);
        });
    });
});
