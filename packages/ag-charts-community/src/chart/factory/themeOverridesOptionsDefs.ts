import {
    type ModuleScope,
    ModuleType,
    type OptionsContribution,
    type OptionsDefs,
    type ResolvedContribution,
    boolean,
    cartesianAxisThemePositions,
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
    const registered = [...moduleRegistry.optionsContributions()];
    const contributionsByChartType = new Map<string | undefined, ResolvedContribution[]>();
    // A path can be owned for one chart type and still missing for another, so placeholders resolve per chart type.
    function contributionsFor(chartType: string | undefined) {
        let contributions = contributionsByChartType.get(chartType);
        if (contributions == null) {
            contributions = [
                ...registered,
                ...uncoveredContributions(ExpectedModules.values(), moduleRegistry, chartType),
            ];
            contributionsByChartType.set(chartType, contributions);
        }
        return contributions;
    }
    const axisModules = [...moduleRegistry.listModulesByType(ModuleType.Axis)];

    function axesDefs(chartType: string | undefined) {
        const axes: OptionsDefs<any> = {};
        for (const axis of axisModules) {
            if (chartType != null && axis.chartType !== chartType) continue;
            const contributions = contributionsFor(axis.chartType);
            const applies = (contribution: OptionsContribution) =>
                contributionMatchesChartType(contribution, axis.chartType) &&
                contributionMatchesAxisType(contribution, axis.name);
            const defs = composeHostContributedDefs<any>(axis.themeOptions, contributions, 'axis', applies, true);
            for (const position of cartesianAxisThemePositions) {
                const positioned = axis.themeOptions[position];
                if (positioned == null) continue;
                // A positional override only extends the option groups it declares, such as `listeners`.
                const nested = contributions.filter(({ relative }) => relative.segments[0].key in positioned);
                defs[position] = composeHostContributedDefs(positioned, nested, 'axis', applies, true);
            }
            axes[axis.name] = defs;
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
            contributionsFor(undefined),
            'chart',
            () => true,
            true
        ),
    };

    for (const series of moduleRegistry.listModulesByType(ModuleType.Series)) {
        const { chartType } = series;
        const chartModule = moduleRegistry.getChartModule(chartType);
        const chartDefs = composeHostContributedDefs(
            chartModule.themeOptions,
            contributionsFor(chartType),
            'chart',
            (contribution) => contributionMatchesChartType(contribution, chartType),
            true
        );
        const seriesDefs = composeHostContributedDefs(
            series.themeOptions,
            contributionsFor(chartType),
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
                ...((series.defaultAxes ?? chartModule.defaultAxes) == null ? {} : { axes: axesDefs(chartType) }),
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
