import fs from 'node:fs';
import path from 'node:path';

import { AgChartOptions } from 'ag-charts-types';

import { mapValues } from '../src/chart/test/utils';
import { VERSION } from '../src/version';

const PACKAGE_VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8')).version;
const IS_LATEST_VERSION = process.env.AG_BENCHMARK_LATEST_VERSION === '1';

export function isHistoricBenchmarkTest() {
    return PACKAGE_VERSION !== VERSION;
}

export function getVersion() {
    const result = VERSION.split('-')[0]
        .split('.')
        .map((n) => /(\d+)/.exec(n)?.[1])
        .map(Number);
    if (result.length !== 3 || result.some((n) => Number.isNaN(n))) {
        throw new Error("Couldn't parse semver of: " + process.env.VERSION);
    }
    return result;
}

export function isAtOrAfterVersion(major: number, minor: number, patch: number) {
    if (IS_LATEST_VERSION) return true;

    const current = getVersion();

    if (major < current[0]) return true;
    if (major > current[0]) return false;
    if (minor < current[1]) return true;
    if (minor > current[1]) return false;
    if (patch < current[2]) return true;

    return patch === current[2];
}

export function isBeforeVersion(major: number, minor: number, patch: number) {
    return !isAtOrAfterVersion(major, minor, patch);
}

export async function waitForUpdate(chart: any): Promise<void> {
    chart = chart.chart;

    return new Promise((resolve) => {
        if (chart._pendingFactoryUpdatesCount > 0 || chart.performUpdateType !== 7) {
            const destroyFn = chart.ctx.updateService.addListener('update-complete', () => {
                resolve();
                destroyFn();
            });
        } else {
            resolve();
        }
    });
}

export function prepareTestOptions<T extends AgChartOptions>(options: T, container: HTMLElement, enterprise: boolean) {
    if (!isAtOrAfterVersion(10, 0, 0)) {
        (options as any).autoSize = false;
    }
    if (isHistoricBenchmarkTest() && isBeforeVersion(12, 1, 0)) {
        // maxRenderedItems not available in older versions.
        if (options.series) {
            for (const series of options.series) {
                delete (series as any).maxRenderedItems;
            }
        }
    }
    if (isHistoricBenchmarkTest() && isBeforeVersion(12, 0, 0)) {
        // highlightStyle => highlight for 12.
        for (const seriesType of Object.values((options as any).theme?.overrides ?? {})) {
            const { series } = seriesType as any;
            if (!series?.highlight) continue;

            series.highlightStyle ??= {
                series: { dimOpacity: series.highlight?.unhighlightedSeries?.opacity },
            };
            delete series.highlight;
        }
    }
    if (isHistoricBenchmarkTest() && isBeforeVersion(11, 1, 0)) {
        // zoom.minVisibleItemsX => zoom.minVisibleItems for 11.1.
        if ((options as any).zoom?.minVisibleItems != null) {
            (options as any).zoom.minVisibleItemsX = Math.max(1, (options as any).zoom.minVisibleItems);
            delete (options as any).zoom.minVisibleItems;
        }
    }
    options.width = 800;
    options.height = 600;
    options.container = container;

    if (enterprise) {
        // Default to animation off.
        options.animation ??= { enabled: false };
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

        (options as any).axes = mapValues((options as any).axes ?? {}, (a) => {
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
        Object.values((options as any).axes ?? {}).some((a) => a.type === 'grouped-category')
    ) {
        for (const d of (options as any).data) {
            const labels = d['ag-Grid-AutoColumn'];
            d['ag-Grid-AutoColumn'] = { labels, toString: () => labels.join(' - ') };
        }
    }

    return options;
}
