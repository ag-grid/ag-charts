import { AgChartOptions } from 'ag-charts-types';

import { ChartUpdateType } from '../src/chart/chartUpdateType';

export function isHistoricBenchmarkTest() {
    return process.env.AG_LIBRARY_VERSION != null && process.env.AG_LIBRARY_VERSION !== 'latest';
}

export function getVersion() {
    if (!isHistoricBenchmarkTest()) return [11, 0, 0];

    const result = process.env
        .AG_LIBRARY_VERSION!.split('.')
        .map((n) => /(\d+)/.exec(n)?.[1])
        .map(Number);
    if (result.length !== 3 || result.some((n) => isNaN(n))) {
        throw new Error("Couldn't parse semver of: " + process.env.AG_LIBRARY_VERSION);
    }
    return result;
}

export function isAtOrAfterVersion(major: number, minor: number, patch: number) {
    const current = getVersion();

    if (major < current[0]) return true;
    if (major > current[0]) return false;
    if (minor < current[1]) return true;
    if (minor > current[1]) return false;
    if (patch < current[2]) return true;

    return patch === current[2];
}

export async function waitForUpdate(chart: any): Promise<void> {
    chart = chart.chart;

    if (chart._pendingFactoryUpdatesCount > 0 || chart.performUpdateType !== ChartUpdateType.NONE) {
        return new Promise((resolve) => {
            const destroyFn = chart.ctx.updateService.addListener('update-complete', () => {
                resolve();
                destroyFn();
            });
        });
    }
}

export function prepareTestOptions<T extends AgChartOptions>(options: T, container: HTMLElement, enterprise: boolean) {
    if (!isAtOrAfterVersion(10, 0, 0)) {
        (options as any).autoSize = false;
    }
    options.width = 800;
    options.height = 600;
    options.container = container;

    if (enterprise) {
        if (!options.animation) {
            // Default to animation off.
            options.animation ??= { enabled: false };
        }
    }

    let baseTestTheme = {
        baseTheme: 'ag-default',
        palette: {
            fills: ['#f3622d', '#fba71b', '#57b757', '#41a9c9', '#4258c9', '#9a42c8', '#c84164', '#888888'],
            strokes: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
        },
    };

    if (typeof options?.theme === 'object' && options?.theme.palette != null) {
        // Keep existing theme.
        baseTestTheme = options.theme as any;
    } else if (typeof options?.theme === 'object') {
        // Keep theme supplied, just override palette colours.
        baseTestTheme = {
            ...options.theme,
            palette: baseTestTheme.palette,
        } as any;
    } else if (typeof options?.theme === 'string') {
        // Override colours.
        baseTestTheme.baseTheme = options.theme;
    }

    options.theme = baseTestTheme as any;

    if (!isAtOrAfterVersion(10, 0, 0)) {
        options.series = options.series?.map((s) => {
            if (s.type === 'scatter' && s.shape != null) {
                const { shape, ...sOther } = s;
                return { ...sOther, marker: { ...sOther.marker, shape } };
            }
            return s;
        });

        (options as any).axes = (options as any).axes?.map((a) => {
            if (a.interval != null) {
                const { interval, ...aOther } = a;
                return { ...aOther, tick: { ...aOther.tick, ...interval } };
            }
            return a;
        });
    }

    if (
        !isAtOrAfterVersion(11, 0, 0) &&
        (options as any).mode === 'integrated' &&
        (options as any).axes?.some((a) => a.type === 'grouped-category')
    ) {
        (options as any).data.forEach((d: object) => {
            const labels = d['ag-Grid-AutoColumn'];
            d['ag-Grid-AutoColumn'] = { labels, toString: () => labels.join(' - ') };
        });
    }

    return options;
}
