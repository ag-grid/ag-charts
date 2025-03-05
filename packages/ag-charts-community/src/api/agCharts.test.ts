import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { getDocument } from 'ag-charts-core';
import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { prepareTestOptions, resetMockConsole, setupMockCanvas, setupMockConsole } from '../chart/test/utils';

describe('AgCharts', () => {
    setupMockConsole({ includeAllLevels: true });

    setupMockCanvas();
    let chart: AgChartInstance;
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        document.body.removeChild(container);
    });

    function expectCachedLogs() {
        expect(console.log).toHaveBeenCalledWith('ChartOptions.isFastPathDelta() - fast path possible.');
        expect(console.log).not.toHaveBeenCalledWith(
            '[CACHE] ChartTheme',
            'miss',
            'createChartTheme',
            expect.any(Object)
        );
    }

    function expectNonCachedLogs() {
        expect(console.log).toHaveBeenCalledWith('ChartOptions.slowSetup()');
        expect(console.log).toHaveBeenCalledWith('[CACHE] ChartTheme', 'miss', 'createChartTheme', expect.anything());
    }

    function expectPoolCreationLogs() {
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Pool[name=sparkline]: Created instance'),
            expect.any(Object)
        );
    }

    function expectPoolReleaseLogs() {
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Pool[name=sparkline]: Returned instance'),
            expect.any(Object)
        );
    }

    function expectPoolReuseLogs() {
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Pool[name=sparkline]: Re-used instance'),
            expect.any(Object)
        );
    }

    function expectNoPoolActivityLogs() {
        expect(console.log).not.toHaveBeenCalledWith(expect.stringMatching(/Pool\[name=.*\]/), expect.any(Object));
    }

    describe('sparkline optimisations', () => {
        const sparklineOptions = {
            width: 200,
            height: 50,
            data: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
        };

        const fastSettings = {
            width: sparklineOptions.width + 100,
            height: sparklineOptions.height + 50,
            data: sparklineOptions.data.toReversed(),
            container: () => getDocument().createElement('div'),
        };

        beforeEach(() => {
            (window as any).agChartsDebug = ['perf', 'pool'];
        });

        afterEach(() => {
            delete (window as any).agChartsDebug;
        });

        describe('#__createSparkline', () => {
            it('should use pooling by default', async () => {
                const options = { ...sparklineOptions };
                prepareTestOptions(options, container);

                const sparkline = AgCharts.__createSparkline(options);
                await sparkline.waitForUpdate();

                expectPoolCreationLogs();
            });

            it('should use slow setup by default', async () => {
                const options = { ...sparklineOptions };
                prepareTestOptions(options, container);

                const sparkline = AgCharts.__createSparkline(options);
                await sparkline.waitForUpdate();

                expectNonCachedLogs();
            });

            it('should use fast setup for re-used instances', async () => {
                const options = { ...sparklineOptions };
                prepareTestOptions(options, container);

                const sparkline = AgCharts.__createSparkline(options);
                await sparkline.waitForUpdate();

                resetMockConsole();
                sparkline.destroy();
                expectPoolReleaseLogs();

                resetMockConsole();
                const sparkline2 = AgCharts.__createSparkline(options);
                await sparkline2.waitForUpdate();

                expectPoolReuseLogs();
                expectCachedLogs();
            });
        });

        describe('for update()', () => {
            for (const property in fastSettings) {
                it(`should use fast setup for ${property} with update()`, async () => {
                    let options = { ...sparklineOptions };
                    prepareTestOptions(options, container);

                    const sparkline = AgCharts.__createSparkline(options);
                    await sparkline.waitForUpdate();

                    resetMockConsole();

                    const propertyValue = fastSettings[property as keyof typeof fastSettings];
                    options = {
                        ...options,
                        [property]: propertyValue instanceof Function ? propertyValue() : propertyValue,
                    };

                    await sparkline.update(options);

                    expectCachedLogs();
                    expectNoPoolActivityLogs();
                });
            }
        });

        describe('for updateDelta()', () => {
            for (const property in fastSettings) {
                it(`should use fast setup for ${property} with updateDelta()`, async () => {
                    const options = { ...sparklineOptions };
                    prepareTestOptions(options, container);

                    const sparkline = AgCharts.__createSparkline(options);
                    await sparkline.waitForUpdate();

                    resetMockConsole();

                    const propertyValue = fastSettings[property as keyof typeof fastSettings];
                    const update = {
                        [property]: propertyValue instanceof Function ? propertyValue() : propertyValue,
                    };

                    await sparkline.updateDelta(update);

                    expectCachedLogs();
                    expectNoPoolActivityLogs();
                });
            }
        });
    });
});
