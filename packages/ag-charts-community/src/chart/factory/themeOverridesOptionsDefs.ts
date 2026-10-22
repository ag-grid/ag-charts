import {
    type ModuleScope,
    ModuleType,
    type OptionsDefs,
    type ResolvedContribution,
    boolean,
    commonThemeOverridesOptionsDefs,
    composeHostContributedDefs,
    contributionMatchesAxisType,
    contributionMatchesChartType,
    contributionMatchesSeriesType,
    moduleMatchesChartType,
    object,
    undocumented,
} from 'ag-charts-core';
import type { AgThemeOverrides } from 'ag-charts-types';

import { isPresetOverridesType } from '../themes/chartTheme';
import { ExpectedModules } from './expectedModules';
import { uncoveredContributions } from './processModuleOptions';

/**
 * The theme overrides schema composed from the modules visible to `moduleRegistry`. An expected module that
 * is not registered only gets a shape check, so its key stays known until `sanitizeThemeModules` drops it.
 */
export function themeOverridesOptionsDefs(moduleRegistry: ModuleScope): OptionsDefs<AgThemeOverrides> {
    const contributions: ResolvedContribution[] = [
        ...moduleRegistry.optionsContributions(),
        ...uncoveredContributions(ExpectedModules.values(), moduleRegistry, undefined),
    ];
    const axisModules = [...moduleRegistry.listModulesByType(ModuleType.Axis)];

    function axesDefs(chartType: string | undefined) {
        const axes: OptionsDefs<any> = {};
        for (const axis of axisModules) {
            if (chartType != null && axis.chartType !== chartType) continue;
            axes[axis.name] = composeHostContributedDefs(
                axis.themeOptions,
                contributions,
                'axis',
                (contribution) =>
                    contributionMatchesChartType(contribution, axis.chartType) &&
                    contributionMatchesAxisType(contribution, axis.name),
                true
            );
        }
        for (const placeholder of ExpectedModules.values()) {
            if (placeholder.type !== ModuleType.Axis || moduleRegistry.hasModule(placeholder.name)) continue;
            if (moduleMatchesChartType(placeholder, chartType)) {
                axes[placeholder.name] = object;
            }
        }
        return axes;
    }

    const entries: Record<string, unknown> = {
        common: composeHostContributedDefs<any>(
            { ...commonThemeOverridesOptionsDefs, axes: axesDefs(undefined) },
            contributions,
            'chart',
            () => true,
            true
        ),
    };

    for (const series of moduleRegistry.listModulesByType(ModuleType.Series)) {
        const { chartType } = series;
        const chartDefs = composeHostContributedDefs(
            moduleRegistry.getChartModule(chartType).themeOptions,
            contributions,
            'chart',
            (contribution) => contributionMatchesChartType(contribution, chartType),
            true
        );
        const seriesDefs = composeHostContributedDefs(
            series.themeOptions,
            contributions,
            'series',
            (contribution) =>
                contributionMatchesChartType(contribution, chartType) &&
                contributionMatchesSeriesType(contribution, series.name),
            true
        );
        if (isPresetOverridesType(series.name)) {
            entries[series.name] = { ...chartDefs, ...seriesDefs };
        } else {
            entries[series.name] = {
                ...chartDefs,
                ...(series.defaultAxes == null ? {} : { axes: axesDefs(chartType) }),
                series: seriesDefs,
                visible: undocumented(boolean),
            };
        }
    }
    for (const placeholder of ExpectedModules.values()) {
        if (placeholder.type === ModuleType.Series && !moduleRegistry.hasModule(placeholder.name)) {
            entries[placeholder.name] = object;
        }
    }

    return entries as OptionsDefs<AgThemeOverrides>;
}
