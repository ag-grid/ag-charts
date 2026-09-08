import { type Mock, afterEach, describe, expect, it, vi } from 'vitest';

import { EventEmitter, type LogIssue, Logger } from 'ag-charts-core';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { EventsHub, EventsHubMap } from '../../core/eventsHub';
import { FailFastError } from '../../util/failFastError';
import type { Chart } from '../chart';
import {
    type AgChartProxy,
    createChart,
    deproxy,
    expectWarningsCalls,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { ChartValidations, type ValidationSeverity } from './chartValidations';

const errorIssue = { severity: 'error', message: 'runtime boom' } as const;
const warningIssue = { severity: 'warning', message: 'bad option' } as const;
const deprecationIssue = { severity: 'deprecation', message: 'deprecated thing' } as const;

function build() {
    const logger = new Logger();
    logger.setEnabledLevels([]);
    const eventsHub: EventsHub = new EventEmitter<EventsHubMap>();
    const validations = new ChartValidations({ logger, eventsHub });
    const changes = vi.fn();
    eventsHub.on('validation:change', changes);
    return { logger, eventsHub, validations, changes };
}

describe('ChartValidations', () => {
    describe('collection', () => {
        it('shows nothing by default, when no severities are selected, regardless of issues', () => {
            const { validations } = build();
            validations.beginCycle([errorIssue, warningIssue]);
            expect(validations.hasVisibleIssues()).toBe(false);
        });

        it('selects each severity independently, showing only the severities it lists', () => {
            const { validations } = build();
            validations.beginCycle([errorIssue, warningIssue, deprecationIssue]);

            validations.setShowOverlayOn(['error']);
            expect(validations.getVisibleIssues()).toEqual({ error: [errorIssue], warning: [], deprecation: [] });

            validations.setShowOverlayOn(['warning']);
            expect(validations.getVisibleIssues()).toEqual({ error: [], warning: [warningIssue], deprecation: [] });

            validations.setShowOverlayOn(['deprecation']);
            expect(validations.getVisibleIssues()).toEqual({
                error: [],
                warning: [],
                deprecation: [deprecationIssue],
            });
        });

        it('collects every logger call as an issue at the severity of its console channel', () => {
            const { logger, validations } = build();
            validations.setShowOverlayOn(['error', 'warning', 'deprecation']);

            logger.warn('w');
            logger.error('e');
            logger.deprecation('d');

            expect(validations.getVisibleIssues()).toEqual({
                error: [{ severity: 'error', message: 'e' }],
                warning: [{ severity: 'warning', message: 'w' }],
                deprecation: [{ severity: 'deprecation', message: 'd' }],
            });
        });

        it('de-duplicates an identical issue re-reported on every update pass, whatever its detail', () => {
            const { logger, validations } = build();
            validations.setShowOverlayOn(['error']);

            for (let pass = 0; pass < 3; pass++) {
                logger.error(new Error('update error'));
            }

            expect(validations.getVisibleIssues().error).toHaveLength(1);
        });

        it('keeps distinct issues with different messages', () => {
            const { logger, validations } = build();
            validations.setShowOverlayOn(['error']);

            logger.error('boom one');
            logger.error('boom two');

            expect(validations.getVisibleIssues().error).toHaveLength(2);
        });

        it('keeps an issue until the next validation cycle, whatever happens in between', () => {
            const { logger, validations } = build();
            validations.setShowOverlayOn(['warning']);
            validations.beginCycle([warningIssue]);

            logger.warnOnce('Uncaught exception in user callback `series[0].label.formatter`');
            expect(validations.getVisibleIssues().warning).toHaveLength(2);

            validations.beginCycle([warningIssue]);
            expect(validations.getVisibleIssues().warning).toEqual([warningIssue]);
        });

        it('a cycle drops a runtime error the previous cycle collected', () => {
            const { logger, validations } = build();
            validations.setShowOverlayOn(['error']);
            logger.error('update error');
            expect(validations.getVisibleIssues().error).toHaveLength(1);

            validations.beginCycle([]);
            expect(validations.hasVisibleIssues()).toBe(false);
        });

        it('dismiss hides the overlay; an identical cycle stays dismissed but a changed one re-shows', () => {
            const { validations } = build();
            validations.setShowOverlayOn(['warning']);
            validations.beginCycle([warningIssue]);
            expect(validations.hasVisibleIssues()).toBe(true);

            validations.dismiss();
            expect(validations.hasVisibleIssues()).toBe(false);

            validations.beginCycle([warningIssue]);
            expect(validations.hasVisibleIssues()).toBe(false);

            validations.beginCycle([warningIssue, { severity: 'warning', message: 'another bad option' }]);
            expect(validations.hasVisibleIssues()).toBe(true);
        });

        it('keeps a dismissed overlay dismissed when the same runtime error re-reports', () => {
            const { logger, validations } = build();
            validations.setShowOverlayOn(['error']);

            logger.error('update error');
            validations.dismiss();
            logger.error('update error');

            expect(validations.hasVisibleIssues()).toBe(false);
            expect(validations.getVisibleIssues().error).toHaveLength(1);
        });

        it('emits validation:change for a new issue, a changed selection, a cycle and a dismissal', () => {
            const { logger, validations, changes } = build();

            validations.setShowOverlayOn(['warning']);
            logger.warn('one');
            validations.beginCycle([errorIssue]);
            validations.dismiss();

            expect(changes).toHaveBeenCalledTimes(4);
        });

        it('does not emit validation:change for a repeated issue or an equal selection', () => {
            const { logger, validations, changes } = build();
            validations.setShowOverlayOn(['error', 'warning']);
            logger.warn('one');
            changes.mockClear();

            validations.setShowOverlayOn(['warning', 'error', 'error']);
            logger.warn('one');
            validations.beginCycle([{ severity: 'warning', message: 'one' }]);

            expect(changes).not.toHaveBeenCalled();
        });
    });

    describe('showOverlayOn membership', () => {
        const allSeverities = ['error', 'warning', 'deprecation'] as const;

        it.each<{ label: string; levels: ValidationSeverity[]; shown: ValidationSeverity[] }>([
            { label: 'empty', levels: [], shown: [] },
            { label: 'error', levels: ['error'], shown: ['error'] },
            { label: 'warning', levels: ['warning'], shown: ['warning'] },
            { label: 'deprecation', levels: ['deprecation'], shown: ['deprecation'] },
            { label: 'error+deprecation', levels: ['error', 'deprecation'], shown: ['error', 'deprecation'] },
            { label: 'warning+deprecation', levels: ['warning', 'deprecation'], shown: ['warning', 'deprecation'] },
            {
                label: 'all three',
                levels: ['error', 'warning', 'deprecation'],
                shown: ['error', 'warning', 'deprecation'],
            },
        ])('showOverlayOn=[$label] shows exactly the severities it lists', ({ levels, shown }) => {
            const { validations } = build();
            validations.setShowOverlayOn(levels);
            validations.beginCycle([errorIssue, warningIssue, deprecationIssue]);

            expect(validations.hasVisibleIssues()).toBe(shown.length > 0);
            const visible = validations.getVisibleIssues();
            for (const severity of allSeverities) {
                expect(visible[severity]).toHaveLength(shown.includes(severity) ? 1 : 0);
            }
        });
    });

    describe('configure', () => {
        it('applies consoleOn to the logger, and falls back to every level for an unusable value', () => {
            const { logger, validations } = build();
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            try {
                validations.configure({ consoleOn: ['error'] });
                logger.warn('quiet');
                logger.error('loud');
                expect(warnSpy).not.toHaveBeenCalled();
                expect(errorSpy).toHaveBeenCalledTimes(1);

                validations.configure({ consoleOn: ['error', 'loud'] });
                logger.warn('heard');
                expect(warnSpy).toHaveBeenCalledTimes(1);
            } finally {
                warnSpy.mockRestore();
                errorSpy.mockRestore();
            }
        });

        it('falls back to nothing for an unusable throwOn, showOverlayOn or issueRaised', () => {
            const { logger, validations } = build();
            validations.configure({ throwOn: 'warning', showOverlayOn: ['warning', 'loud'], issueRaised: 'nope' });

            expect(() => logger.warn('w')).not.toThrow();
            expect(validations.hasVisibleIssues()).toBe(false);
        });
    });

    describe('issueRaised', () => {
        function withListener() {
            const built = build();
            const listener = vi.fn();
            built.validations.configure({ issueRaised: listener });
            return { ...built, listener };
        }

        it('is told { severity, message } for every severity, in order', () => {
            const { validations, listener } = withListener();

            validations.beginCycle([errorIssue, warningIssue, deprecationIssue]);

            expect(listener.mock.calls).toEqual([[errorIssue], [warningIssue], [deprecationIssue]]);
        });

        it('is told about a live logger call, without its detail or cause', () => {
            const { logger, listener } = withListener();

            logger.error(new Error('boom'));

            expect(listener).toHaveBeenCalledWith({ severity: 'error', message: 'boom' });
        });

        it('is told once about an issue the console de-duplicates too', () => {
            const { logger, listener } = withListener();

            logger.warnOnce('repeat');
            logger.warnOnce('repeat');

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('a cycle re-applying the same issues tells the listener nothing; a new issue is told', () => {
            const { validations, listener } = withListener();

            validations.beginCycle([errorIssue, warningIssue]);
            expect(listener).toHaveBeenCalledTimes(2);

            listener.mockClear();
            validations.beginCycle([errorIssue, warningIssue]);
            expect(listener).not.toHaveBeenCalled();

            validations.beginCycle([errorIssue, warningIssue, deprecationIssue]);
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(deprecationIssue);
        });

        it('is told regardless of showOverlayOn and dismissal', () => {
            const { logger, validations, listener } = withListener();
            validations.setShowOverlayOn([]);

            validations.beginCycle([errorIssue]);
            validations.dismiss();
            logger.warn(warningIssue.message);

            expect(listener.mock.calls).toEqual([[errorIssue], [warningIssue]]);
        });

        it('a throwing listener does not propagate out of the logging call, and is reported through the logger', () => {
            const { logger, listener } = withListener();
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            logger.setEnabledLevels(['error']);
            listener.mockImplementation(() => {
                throw new Error('listener boom');
            });

            expect(() => logger.warn('problem')).not.toThrow();

            expect(errorSpy).toHaveBeenCalledWith(
                'AG Charts - validations.issueRaised threw an error',
                expect.any(Error)
            );
            errorSpy.mockRestore();
        });

        it('a re-entrant listener does not recurse, and its issues are delivered after it returns', () => {
            const { logger, listener } = withListener();
            const depths: number[] = [];
            let depth = 0;
            let calls = 0;
            listener.mockImplementation(() => {
                depth += 1;
                depths.push(depth);
                calls += 1;
                if (calls < 5) logger.warn(`re-entrant ${calls}`);
                depth -= 1;
            });

            logger.error('first');

            expect(listener).toHaveBeenCalledTimes(5);
            expect(depths).toEqual([1, 1, 1, 1, 1]);
        });

        it('a listener replaced from inside a callback does not receive the rest of that batch', () => {
            const { validations, listener } = withListener();
            const replacement = vi.fn();
            listener.mockImplementation(() => validations.configure({ issueRaised: replacement }));

            validations.beginCycle([errorIssue, warningIssue]);

            expect(listener).toHaveBeenCalledTimes(2);
            expect(replacement).not.toHaveBeenCalled();
        });

        it('an issue heard live before the cycle begins is not told again by the cycle', () => {
            const { logger, validations, listener } = withListener();

            logger.error('argument boom');
            validations.beginCycle([{ severity: 'error', message: 'argument boom' }]);

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('a replaced listener is told the current issues afresh on the next cycle', () => {
            const { validations, listener } = withListener();
            validations.beginCycle([errorIssue]);
            const replacement = vi.fn();
            validations.configure({ issueRaised: replacement });

            validations.beginCycle([errorIssue]);

            expect(listener).toHaveBeenCalledTimes(1);
            expect(replacement).toHaveBeenCalledWith(errorIssue);
        });

        it('a cycle handed over from a provisional instance does not re-tell the same listener', () => {
            const { validations, listener } = withListener();
            const provisional = build().validations;
            provisional.configure({ issueRaised: listener });
            provisional.beginCycle([errorIssue, warningIssue]);
            expect(listener).toHaveBeenCalledTimes(2);

            validations.beginCycle([errorIssue, warningIssue, deprecationIssue], provisional);

            expect(listener).toHaveBeenCalledTimes(3);
            expect(listener).toHaveBeenLastCalledWith(deprecationIssue);
        });
    });

    describe('throwOn', () => {
        it('throws from inside the logging call for an armed severity, after the listener was told', () => {
            const { logger, validations } = build();
            const listener = vi.fn();
            validations.configure({ throwOn: ['warning'], issueRaised: listener });

            expect(() => logger.warn('Option `a` cannot be set to `b`, ignoring.')).toThrow(FailFastError);
            expect(() => logger.warn('Option `a` cannot be set to `b`, ignoring.')).toThrow(
                'AG Charts - validations.throwOn: warning - Option `a` cannot be set to `b`'
            );
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('arms each severity independently', () => {
            const { logger, validations } = build();
            validations.configure({ throwOn: ['error', 'deprecation'] });

            expect(() => logger.warn('w')).not.toThrow();
            expect(() => logger.error('e')).toThrow(FailFastError);
            expect(() => logger.deprecation('d')).toThrow(FailFastError);
        });

        it('chains the logged Error as the cause', () => {
            const { logger, validations } = build();
            validations.configure({ throwOn: ['error'] });
            const error = new Error('boom');

            let thrown: unknown;
            try {
                logger.error(error);
            } catch (e) {
                thrown = e;
            }

            expect(thrown).toBeInstanceOf(FailFastError);
            expect((thrown as FailFastError).cause).toBe(error);
        });

        it('throws on every occurrence, unlike the once-only console and listener reports', () => {
            const { logger, validations } = build();
            validations.configure({ throwOn: ['warning'] });

            expect(() => logger.warnOnce('repeat')).toThrow(FailFastError);
            expect(() => logger.warnOnce('repeat')).toThrow(FailFastError);
        });

        it('does not throw again for a fail-fast error a catch site re-logs', () => {
            const { logger, validations } = build();
            validations.configure({ throwOn: ['error'] });

            let thrown: unknown;
            try {
                logger.error('boom');
            } catch (e) {
                thrown = e;
            }

            expect(() => logger.error(thrown)).not.toThrow();
        });

        it('is suspended for a pass with no caller to throw to', () => {
            const { logger, validations } = build();
            validations.configure({ throwOn: ['warning'] });

            const resume = validations.suspendFailFast();
            expect(() => logger.warn('w')).not.toThrow();
            resume();
            expect(() => logger.warn('w')).toThrow(FailFastError);
        });
    });
});

describe('ChartValidations - chart integration', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    const data = [
        { x: 'A', y: 10 },
        { x: 'B', y: 20 },
    ];

    function expectErrorsCalls() {
        const mock = console.error as Mock;
        const calls = mock.mock.calls;
        mock.mockClear();
        return expect(calls);
    }

    function options(extra: Partial<AgCartesianChartOptions>): AgCartesianChartOptions {
        return prepareTestOptions({
            width: 400,
            height: 300,
            data,
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            ...extra,
        } as AgCartesianChartOptions);
    }

    it('reports a series callback exception as a warning to the overlay and the listener, matching the console', async () => {
        const issueRaised = vi.fn();
        chart = await createChart(
            options({
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        label: {
                            formatter: () => {
                                throw new Error('formatter boom');
                            },
                        },
                    },
                ],
                validations: { showOverlayOn: ['warning'], issueRaised },
            })
        );

        expect(issueRaised).toHaveBeenCalledWith({
            severity: 'warning',
            message: expect.stringContaining('Uncaught exception in user callback'),
        });
        expect(chart.ctx.validations.getVisibleIssues().warning).toHaveLength(1);
        expect(chart.ctx.validations.getVisibleIssues().error).toHaveLength(0);
        expectWarningsCalls().toHaveLength(1);
    });

    it('rejects the update for a series callback exception when throwOn selects warning', async () => {
        const proxy = AgCharts.create(options({ validations: { throwOn: ['warning'] } })) as AgChartProxy;
        chart = deproxy(proxy);
        await proxy.waitForUpdate();

        await expect(
            proxy.update(
                options({
                    series: [
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'y',
                            itemStyler: () => {
                                throw new Error('styler boom');
                            },
                        },
                    ],
                    validations: { throwOn: ['warning'] },
                })
            )
        ).rejects.toThrow(/^AG Charts - validations\.throwOn: warning - Uncaught exception in user callback/);
        expectWarningsCalls().toHaveLength(1);
    });

    it('keeps a callback issue on the overlay across a hover', async () => {
        chart = await createChart(
            options({
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        label: {
                            formatter: () => {
                                throw new Error('formatter boom');
                            },
                        },
                    },
                ],
                validations: { showOverlayOn: ['warning'] },
            })
        );
        expect(chart.ctx.validations.hasVisibleIssues()).toBe(true);

        await hoverAction(600, 400)(chart);
        await waitForChartStability(chart);

        expect(chart.ctx.validations.hasVisibleIssues()).toBe(true);
        expectWarningsCalls().toHaveLength(1);
    });

    it('reports a tooltip renderer exception to the overlay and the listener at the hover that raised it', async () => {
        const issueRaised = vi.fn();
        chart = await createChart(
            options({
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        tooltip: {
                            renderer: () => {
                                throw new Error('renderer boom');
                            },
                        },
                    },
                ],
                validations: { showOverlayOn: ['warning'], issueRaised },
            })
        );
        expect(issueRaised).not.toHaveBeenCalled();

        await hoverAction(600, 400)(chart);
        await waitForChartStability(chart);

        expect(issueRaised).toHaveBeenCalledWith({
            severity: 'warning',
            message: expect.stringContaining('tooltip.renderer'),
        });
        expect(chart.ctx.validations.getVisibleIssues().warning).toHaveLength(1);
        expectWarningsCalls().toHaveLength(1);
    });

    it('shows an omitted series type on the overlay and tells the listener, with throwOn unset', async () => {
        const issueRaised = vi.fn();
        chart = await createChart(
            options({
                series: [{ xKey: 'x', yKey: 'y' } as any],
                validations: { showOverlayOn: ['warning'], issueRaised },
            })
        );

        expect(issueRaised).toHaveBeenCalledWith({
            severity: 'warning',
            message: expect.stringContaining('series[0].type` is required'),
        });
        expect(chart.ctx.validations.getVisibleIssues().warning).toHaveLength(1);
        expectWarningsCalls().toHaveLength(1);
    });

    it('reports an invalid itemStyler return value to the overlay and the listener as a warning', async () => {
        const issueRaised = vi.fn();
        chart = await createChart(
            options({
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', itemStyler: () => ({ fill: 123 as any }) }],
                validations: { showOverlayOn: ['warning'], issueRaised },
            })
        );

        expect(issueRaised).toHaveBeenCalledWith({
            severity: 'warning',
            message: expect.stringContaining('itemStyler'),
        });
        expect(chart.ctx.validations.getVisibleIssues().warning).toHaveLength(1);
        expectWarningsCalls().toHaveLength(1);
    });

    it('rejects the update for a missing data key when throwOn selects warning', async () => {
        const proxy = AgCharts.create(options({ validations: { throwOn: ['warning'] } })) as AgChartProxy;
        chart = deproxy(proxy);
        await proxy.waitForUpdate();

        await expect(
            proxy.update(
                options({
                    series: [{ type: 'bar', xKey: 'x', yKey: 'missing' }],
                    validations: { throwOn: ['warning'] },
                })
            )
        ).rejects.toThrow(/^AG Charts - validations\.throwOn: warning - .*'missing' was not found/);
        expectWarningsCalls().toHaveLength(1);
    });

    it('shows an unrecognised series type on the overlay and tells the listener, with throwOn unset', async () => {
        const issueRaised = vi.fn();
        chart = await createChart(
            options({
                series: [{ type: '' as any, xKey: 'x', yKey: 'y' }],
                validations: { showOverlayOn: ['warning'], issueRaised },
            })
        );

        expect(issueRaised).toHaveBeenCalledWith({
            severity: 'warning',
            message: expect.stringContaining('series[0].type'),
        });
        expect(chart.ctx.validations.getVisibleIssues().warning).toHaveLength(1);
        expectWarningsCalls().toHaveLength(1);
    });

    it('shows a dropped enterprise module on the overlay and tells the listener, with throwOn unset', async () => {
        const issueRaised = vi.fn();
        chart = await createChart(
            options({
                zoom: { enabled: true },
                validations: { showOverlayOn: ['error'], issueRaised },
            } as Partial<AgCartesianChartOptions>)
        );

        expect(issueRaised).toHaveBeenCalledWith({
            severity: 'error',
            message: expect.stringContaining('required modules are not registered'),
        });
        expect(chart.ctx.validations.getVisibleIssues().error).toHaveLength(1);
        expectErrorsCalls().toHaveLength(1);
    });

    it('carries the issues of a validated pass into the chart it creates', async () => {
        const issueRaised = vi.fn();
        chart = await createChart(
            options({
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', strokeWidth: 'thick' as any }],
                validations: { showOverlayOn: ['warning'], issueRaised },
            })
        );

        const issues: LogIssue[] = chart.ctx.validations.issues;
        expect(issues).toEqual([{ severity: 'warning', message: expect.stringContaining('series[0].strokeWidth') }]);
        expect(issueRaised).toHaveBeenCalledTimes(1);
        expectWarningsCalls().toHaveLength(1);
    });
});
