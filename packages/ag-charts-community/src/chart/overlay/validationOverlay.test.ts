import { afterEach, describe, expect, test, vi } from 'vitest';

import { ChartUpdateType } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { Chart } from '../chart';
import { TooltipManager } from '../interaction/tooltipManager';
import {
    createChart,
    deproxy,
    expectWarningsCalls,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
} from '../test/utils';
import type { GroupedValidationIssues } from '../validation/validationIssueCollector';
import { getValidationOverlay } from './validationOverlay';

// A single-issue misconfiguration: an invalid `strokeWidth` validated against `lineSeriesOptionsDef`
// before construction, so the shared `validations` collector captures it at `warning` severity.
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

    describe('#changed issues', () => {
        // The selected overlay state stays 'validation' across both updates (never dismissed), so this
        // exercises the content-refresh path independently of any state transition.
        test('replacing one issue with another re-renders the overlay content while it stays shown', async () => {
            const options = prepareTestOptions({
                ...invalidStrokeWidthOptions,
                validations: { overlayLevel: 'warning' },
            } as AgChartOptions);
            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            await chart.waitForUpdate(5000, true);

            const messagesFor = () =>
                Array.from(chart.ctx.agDocument.body.querySelectorAll('.ag-charts-validation-overlay__message')).map(
                    (el) => el.textContent ?? ''
                );

            expect(messagesFor().some((message) => message.includes('series[0].strokeWidth'))).toBe(true);

            await proxy.update({
                ...options,
                series: [{ type: 'line', xKey: 'x', yKey: 'y', lineDashOffset: 'alsobad' as any }],
            } as AgChartOptions);
            await chart.waitForUpdate(5000, true);

            expect(chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.getAttribute('aria-hidden')).toEqual(
                'false'
            );
            const messages = messagesFor();
            expect(messages.some((message) => message.includes('series[0].lineDashOffset'))).toBe(true);
            expect(messages.some((message) => message.includes('series[0].strokeWidth'))).toBe(false);

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

    describe('#tooltip suppression', () => {
        // The tooltip is a browser top-layer popover, so it paints over the overlay regardless of z-index; a
        // visible overlay must hold it back and clearing the overlay must release it.
        test('a visible overlay suppresses the tooltip; dismissing it releases the tooltip', async () => {
            chart = await createChart(invalidStrokeWidthOptions);
            expect(chart.validationCollector.hasVisibleIssues()).toBe(false);

            const suppressSpy = vi.spyOn(chart.ctx.tooltipManager, 'suppressTooltip');
            const unsuppressSpy = vi.spyOn(chart.ctx.tooltipManager, 'unsuppressTooltip');

            chart.validationCollector.setOverlayLevel('warning');
            expect(chart.validationCollector.hasVisibleIssues()).toBe(true);
            expect(suppressSpy).toHaveBeenCalledWith('validation-overlay');
            expect(unsuppressSpy).not.toHaveBeenCalled();

            chart.validationCollector.dismiss();
            expect(chart.validationCollector.hasVisibleIssues()).toBe(false);
            expect(unsuppressSpy).toHaveBeenCalledWith('validation-overlay');

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`series[0].strokeWidth\` cannot be set to \`"notanumber"\`; expecting a number greater than or equal to 0, ignoring.",
  ],
]
`);
        });

        test('a chart whose overlay is visible on the first render suppresses the tooltip immediately', async () => {
            // The overlay becomes visible while the chart is set up, so the suppression fires before an
            // instance-level spy could attach; spy on the prototype so the initial call is still observed.
            const suppressSpy = vi.spyOn(TooltipManager.prototype, 'suppressTooltip');
            try {
                chart = await createChart({
                    ...invalidStrokeWidthOptions,
                    validations: { overlayLevel: 'warning' },
                } as AgChartOptions);

                expect(chart.validationCollector.hasVisibleIssues()).toBe(true);
                expect(suppressSpy).toHaveBeenCalledWith('validation-overlay');
            } finally {
                suppressSpy.mockRestore();
            }

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`series[0].strokeWidth\` cannot be set to \`"notanumber"\`; expecting a number greater than or equal to 0, ignoring.",
  ],
]
`);
        });
    });

    describe('#callback errors', () => {
        // A throwing user callback is swallowed by the shared `safeCall` guard, so it never reaches
        // `tryPerformUpdate`'s catch, yet must still surface as an error-severity overlay entry.
        const throwingItemStylerOptions: AgChartOptions = {
            data: [
                { x: 'Jan', y: 10 },
                { x: 'Feb', y: 15 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'y',
                    itemStyler: () => {
                        throw new Error('itemStyler boom');
                    },
                } as any,
            ],
        };

        test('a throwing itemStyler surfaces one error entry on the overlay and the chart still renders', async () => {
            chart = await createChart({
                ...throwingItemStylerOptions,
                validations: { overlayLevel: 'error' },
            } as AgChartOptions);

            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-validation-overlay');
            expect(overlayEl).not.toBeNull();

            const errorSection = overlayEl!.querySelector('.ag-charts-validation-overlay__section--error');
            expect(errorSection).not.toBeNull();

            // The styler throws once per datum, but the caught errors collapse to a single overlay entry.
            const messages = Array.from(errorSection!.querySelectorAll('.ag-charts-validation-overlay__message')).map(
                (el) => el.textContent ?? ''
            );
            expect(messages).toHaveLength(1);
            // The "Uncaught exception in user callback" wording only comes from the safeCall guard, proving the
            // error surfaced via the swallowed-callback path rather than a propagated render crash.
            expect(messages[0]).toContain('Uncaught exception in user callback');
            expect(messages[0]).toContain('itemStyler');

            expectWarningsCalls().toEqual([
                [expect.stringContaining('Uncaught exception in user callback'), expect.any(Error)],
            ]);
        });

        test('a still-broken itemStyler stays on the overlay across a cache-hit redraw', async () => {
            chart = await createChart({
                ...throwingItemStylerOptions,
                validations: { overlayLevel: 'error' },
            } as AgChartOptions);

            const errorMessages = () =>
                Array.from(
                    chart.ctx.agDocument.body.querySelectorAll(
                        '.ag-charts-validation-overlay__section--error .ag-charts-validation-overlay__message'
                    )
                ).map((el) => el.textContent ?? '');

            expect(errorMessages()).toHaveLength(1);

            // A redraw that reuses the callback cache never re-invokes the styler, so no fresh error is
            // collected this cycle; the committed error must survive rather than be wiped by an empty cycle.
            chart.update(ChartUpdateType.SCENE_RENDER);
            await chart.waitForUpdate(5000, true);

            expect(errorMessages()).toHaveLength(1);

            expectWarningsCalls().toEqual([
                [expect.stringContaining('Uncaught exception in user callback'), expect.any(Error)],
            ]);
        });
    });

    describe('#dismiss', () => {
        // Assert on `aria-hidden`: hideOverlay clears content via `innerText`, which jsdom does not apply to
        // descendant nodes, so a child element can linger in jsdom while `aria-hidden` stays correct.
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

            // A dismiss happens outside any update cycle, so nothing drives a removal animation to completion; the
            // overlay must detach synchronously rather than linger until the next resize.
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

    // No community-level deprecated option can drive a deprecation-severity issue through a real chart, so
    // the renderer is exercised directly.
    describe('#deprecation section', () => {
        test('renders a Deprecations section, count heading and summary for a deprecation-severity issue', async () => {
            chart = await createChart({
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            const grouped: GroupedValidationIssues = {
                error: [],
                warning: [],
                deprecation: [
                    {
                        severity: 'deprecation',
                        message: 'Option `series[0].verticalSpacing` is deprecated. Use `depthSpacing` instead.',
                        code: 'series[0].verticalSpacing',
                    },
                ],
            };

            const overlay = getValidationOverlay({
                agDocument: chart.ctx.agDocument,
                localeManager: chart.ctx.localeManager,
                grouped,
                onDismiss: () => undefined,
            });

            expect(overlay.querySelector('.ag-charts-validation-overlay__summary')?.textContent).toEqual(
                'AG Charts found 1 deprecation'
            );

            const section = overlay.querySelector('.ag-charts-validation-overlay__section--deprecation');
            expect(section).not.toBeNull();
            expect(section!.querySelector('.ag-charts-validation-overlay__section-heading')?.textContent).toEqual(
                'Deprecations (1)'
            );
            expect(section!.querySelectorAll('.ag-charts-validation-overlay__message')).toHaveLength(1);

            // Only deprecations are present, so no louder-severity sections are rendered.
            expect(overlay.querySelector('.ag-charts-validation-overlay__section--error')).toBeNull();
            expect(overlay.querySelector('.ag-charts-validation-overlay__section--warning')).toBeNull();
        });
    });

    describe('#copy button availability', () => {
        const groupedWithIssue: GroupedValidationIssues = {
            error: [],
            warning: [{ severity: 'warning', message: 'Invalid strokeWidth', code: 'series[0].strokeWidth' }],
            deprecation: [],
        };

        // The overlay reads the clipboard off agDocument.navigator, so a per-test navigator lets each
        // case drive the writable / unavailable branch without touching the shared jsdom navigator.
        const agDocumentWith = (clipboard?: { writeText: (data: string) => Promise<void> }) => {
            const agDocument = Object.create(chart.ctx.agDocument);
            Object.defineProperty(agDocument, 'navigator', { value: { clipboard } });
            return agDocument;
        };

        test('renders the Copy button and writes diagnostics when the clipboard is writable', async () => {
            chart = await createChart({ data: [{ x: 'a', y: 1 }], series: [{ type: 'line', xKey: 'x', yKey: 'y' }] });

            const writeText = vi.fn().mockResolvedValue(undefined);
            const overlay = getValidationOverlay({
                agDocument: agDocumentWith({ writeText }),
                localeManager: chart.ctx.localeManager,
                grouped: groupedWithIssue,
                onDismiss: () => undefined,
            });

            const copyButton = overlay.querySelector<HTMLButtonElement>('.ag-charts-validation-overlay__copy');
            expect(copyButton).not.toBeNull();

            copyButton!.click();
            expect(writeText).toHaveBeenCalledWith('[warning] Invalid strokeWidth\nseries[0].strokeWidth');
        });

        test('omits the Copy button but keeps Dismiss when the clipboard is unavailable', async () => {
            chart = await createChart({ data: [{ x: 'a', y: 1 }], series: [{ type: 'line', xKey: 'x', yKey: 'y' }] });

            const overlay = getValidationOverlay({
                agDocument: agDocumentWith(),
                localeManager: chart.ctx.localeManager,
                grouped: groupedWithIssue,
                onDismiss: () => undefined,
            });

            expect(overlay.querySelector('.ag-charts-validation-overlay__copy')).toBeNull();
            expect(overlay.querySelector('.ag-charts-validation-overlay__dismiss')).not.toBeNull();
        });
    });
});
