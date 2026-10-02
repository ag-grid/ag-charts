import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    deproxy,
    prepareFinancialTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartInstance, AgChartTheme, AgVolumeProfileChartOptions } from 'ag-charts-types';

import { setupEnterpriseModules } from '../../setup';
import { getIrregularVolumeProfile, getRegularVolumeProfile } from '../test/volumeProfileData';

setupEnterpriseModules();

describe('volumeProfilePreset', () => {
    setupMockConsole();

    let chart: AgChartInstance<AgVolumeProfileChartOptions>;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        vi.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const volumeProfile: AgVolumeProfileChartOptions = {
        data: getRegularVolumeProfile(),
        upKey: 'upVolume',
        downKey: 'downVolume',
        title: { text: 'Volume Profile' },
    };

    const EXAMPLES: Record<string, AgVolumeProfileChartOptions> = {
        default: volumeProfile,
        'smaller tick size': { ...volumeProfile, tickSize: 1 },
        'matching tick size': { ...volumeProfile, tickSize: 2.5 },
        'larger tick size': { ...volumeProfile, tickSize: 5 },
        'irregular data': { ...volumeProfile, data: getIrregularVolumeProfile() },
    };

    it.each(Object.entries(EXAMPLES))(
        'for %s it should render to canvas as expected',
        async (_exampleName, example) => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...example }));
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        }
    );

    it('should update the profile on an add transaction', async () => {
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
        await waitForChartStability(chart);
        await chart.applyTransaction({ add: [{ price: 210, upVolume: 50e6, downVolume: 40e6 }] });
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('should update the profile on an update transaction', async () => {
        // Own rows, as the update mutates one in place.
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({ ...volumeProfile, data: getRegularVolumeProfile() })
        );
        await waitForChartStability(chart);
        const datum = chart.getOptions().data!.at(-1)!;
        datum.upVolume = 150e6;
        await chart.applyTransaction({ update: [datum] });
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('should read the price, up and down values from the given keys', async () => {
        const data = getRegularVolumeProfile().map(({ price, upVolume, downVolume }) => ({
            level: price,
            buys: upVolume,
            sells: downVolume,
        }));
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({ data, priceKey: 'level', upKey: 'buys', downKey: 'sells' })
        );
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('should colour the bars from the theme palette', async () => {
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({
                ...volumeProfile,
                theme: { params: {}, palette: { up: { fill: '#1565c0' }, down: { fill: '#ef6c00' } } },
            })
        );
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('should apply the theme overrides', async () => {
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({
                ...volumeProfile,
                theme: {
                    params: {},
                    overrides: {
                        common: {
                            title: { color: '#1565c0', fontSize: 24 },
                            axes: {
                                category: { label: { color: '#ef6c00' } },
                                number: { label: { color: '#2e7d32' } },
                            },
                        },
                    },
                },
            })
        );
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('keeps the preset base theme under a user theme naming no base of its own', async () => {
        const options = prepareFinancialTestOptions({ ...volumeProfile });
        const theme = options.theme as AgChartTheme;
        expect(theme.baseTheme).toBeUndefined();

        chart = AgCharts.createVolumeProfileChart(options);
        await waitForChartStability(chart);

        // `ag-financial`'s up colour; the default theme would resolve a green of its own.
        const { activeTheme } = deproxy(chart).chartOptions as { activeTheme: { palette: AgChartTheme['palette'] } };
        expect(activeTheme.palette?.up?.fill).toBe('#089981');
    });
});
