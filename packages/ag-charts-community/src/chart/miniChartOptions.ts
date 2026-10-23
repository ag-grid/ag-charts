import { entries, mergeDefaults } from 'ag-charts-core';
import type { AgBaseAxisOptions, AgChartOptions } from 'ag-charts-types';

const MINI_CHART_LABEL_EXCLUDED: ReadonlySet<string> = new Set([
    'interval',
    'autoRotate',
    'autoRotateAngle',
    'itemStyler',
    'minSpacing',
    'rotation',
]);

const HORIZONTAL_AXIS_POSITIONS = new Set(['top', 'bottom']);

const TIME_LIKE_AXIS_TYPES = new Set(['time', 'unit-time', 'ordinal-time']);

const MINI_CHART_AXIS_STRIPPED_KEYS = new Set(['thickness', 'title', 'crosshair', 'depthOptions']);

// Mini-chart axes never inherit main-axis tick-density controls; these keys come solely from
// `navigator.miniChart.label.interval`, while other interval keys still fall through.
const MINI_CHART_INTERVAL_DENSITY_KEYS = ['step', 'values', 'minSpacing', 'maxSpacing'] as const;

function deriveMiniChartInterval(
    intervalOverride: Record<string, unknown> | undefined,
    sourceInterval: object | undefined
): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...(sourceInterval as object), ...intervalOverride };
    for (const key of MINI_CHART_INTERVAL_DENSITY_KEYS) {
        merged[key] = intervalOverride?.[key];
    }
    return merged;
}

function stripAxisOptionsForMiniChart(axisOptions: AgBaseAxisOptions): AgBaseAxisOptions {
    const source = axisOptions as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
        if (MINI_CHART_AXIS_STRIPPED_KEYS.has(key)) continue;
        result[key] = source[key];
    }
    return result as AgBaseAxisOptions;
}

/**
 * Mini-chart grouped-category axes show only the leaf-level depth labels.
 * Returns a derived `depthOptions` array (or `[{ label: { enabled: true } }]`
 * if the source omitted the field) with non-leaf labels disabled.
 */
function deriveMiniChartGroupedCategoryDepth(sourceDepth: unknown[] | undefined) {
    if (!Array.isArray(sourceDepth) || sourceDepth.length === 0) {
        return [{ label: { enabled: true } }];
    }
    return sourceDepth.map((entry, i) => {
        if (i === 0) return entry;
        return mergeDefaults({ label: { enabled: false } }, entry as { label?: { enabled?: boolean } } | undefined);
    });
}

export function deriveMiniChartOptions(completeOptions: AgChartOptions): AgChartOptions {
    const sourceAxes = (completeOptions as { axes?: Record<string, AgBaseAxisOptions> }).axes;
    if (sourceAxes == null) return completeOptions;

    const miniChartLabel = completeOptions.navigator?.miniChart?.label as Record<string, unknown> | undefined;
    const horizontalLabelOverride: Record<string, unknown> = {};
    for (const key of Object.keys(miniChartLabel ?? {})) {
        if (MINI_CHART_LABEL_EXCLUDED.has(key)) continue;
        horizontalLabelOverride[key] = miniChartLabel![key];
    }
    const horizontalIntervalOverride = miniChartLabel?.interval as object | undefined;

    const derivedAxes: Record<string, AgBaseAxisOptions> = {};
    for (const [id, axisOptions] of entries(sourceAxes)) {
        const isHorizontal = HORIZONTAL_AXIS_POSITIONS.has((axisOptions as { position?: string }).position ?? '');
        const isGroupedCategoryHorizontal = isHorizontal && axisOptions.type === 'grouped-category';
        const baseLabel = isHorizontal ? horizontalLabelOverride : {};
        const visibilityOverride = isHorizontal
            ? { enabled: !isGroupedCategoryHorizontal, ...(isGroupedCategoryHorizontal ? { rotation: 0 } : {}) }
            : { enabled: false };
        // Mini-chart strips axis chrome: gridLines and ticks always off; line off
        // on the horizontal axis only (vertical axes keep their line as a frame).
        const lineOverride = isHorizontal ? { enabled: false } : undefined;
        const parentLevelOverride =
            isHorizontal && TIME_LIKE_AXIS_TYPES.has(axisOptions.type ?? '') ? { enabled: false } : undefined;
        // Mini-chart axes never inherit thickness, title, crosshair or grouped-category depth styling.
        const sourceDepth = (axisOptions as { depthOptions?: unknown[] }).depthOptions;
        const groupedCategoryDepth = isGroupedCategoryHorizontal
            ? deriveMiniChartGroupedCategoryDepth(sourceDepth)
            : undefined;
        const restAxisOptions = stripAxisOptionsForMiniChart(axisOptions);
        const derived: Record<string, unknown> = {
            ...restAxisOptions,
            label: mergeDefaults(visibilityOverride, baseLabel, axisOptions.label),
            gridLine: mergeDefaults({ enabled: false }, axisOptions.gridLine),
            tick: mergeDefaults({ enabled: false }, axisOptions.tick),
            line: mergeDefaults(lineOverride, axisOptions.line),
            interval: isHorizontal
                ? deriveMiniChartInterval(
                      horizontalIntervalOverride as Record<string, unknown> | undefined,
                      axisOptions.interval
                  )
                : axisOptions.interval,
            title: { enabled: false },
        };
        if (parentLevelOverride != null) {
            const sourceParentLevel = (axisOptions as { parentLevel?: object }).parentLevel;
            derived.parentLevel = mergeDefaults(parentLevelOverride, sourceParentLevel);
        }
        if (groupedCategoryDepth != null) {
            derived.depthOptions = groupedCategoryDepth;
        }
        derivedAxes[id] = derived as AgBaseAxisOptions;
    }

    return { ...completeOptions, axes: derivedAxes } as AgChartOptions;
}

// Mini-chart series never carry the user id, so they cannot collide with the main chart's series.
export function filterMiniChartSeries(
    series: AgChartOptions['series'] | undefined
): AgChartOptions['series'] | undefined;
export function filterMiniChartSeries(series: any[] | undefined): any[] | undefined {
    return series?.filter((s) => s.showInMiniChart !== false).map(({ id: _id, ...s }) => s);
}
