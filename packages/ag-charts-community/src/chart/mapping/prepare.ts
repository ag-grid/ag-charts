import type {
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartOptions,
    AgChartThemePalette,
    AgTooltipPositionOptions,
} from '../../options/agChartOptions';
import type { JsonMergeOptions } from '../../util/json';
import { DELETE, jsonMerge, jsonWalk } from '../../util/json';
import { Logger } from '../../util/logger';
import { AXIS_TYPES } from '../factory/axisTypes';
import { CHART_TYPES } from '../factory/chartTypes';
import { getSeriesDefaults, getSeriesPaletteFactory, isDefaultAxisSwapNeeded } from '../factory/seriesTypes';
import type { ChartTheme } from '../themes/chartTheme';
import { resolveModuleConflicts, swapAxes } from './defaults';
import type { SeriesOptions } from './prepareSeries';
import { processSeriesOptions } from './prepareSeries';
import { getChartTheme } from './themes';
import {
    type AxesOptionsTypes,
    type SeriesOptionsTypes,
    isAgCartesianChartOptions,
    isAgHierarchyChartOptions,
    isAgPolarChartOptions,
    isAxisOptionType,
    isSeriesOptionType,
    optionsType,
} from './types';

function takeColours(context: PreparationContext, colours: string[], maxCount: number): string[] {
    const result = [];

    for (let count = 0; count < maxCount; count++) {
        result.push(colours[(count + context.colourIndex) % colours.length]);
    }

    return result;
}

interface PreparationContext {
    colourIndex: number;
    palette: AgChartThemePalette;
    userPalette: AgChartThemePalette | null;
    theme: ChartTheme;
}

export const noDataCloneMergeOptions: JsonMergeOptions = {
    avoidDeepClone: ['data'],
};

export function prepareOptions<T extends AgChartOptions>(options: T): T {
    sanityCheckOptions(options);

    // Determine type and ensure it's explicit in the options config.
    const type = optionsType(options);

    const globalTooltipPositionOptions = options.tooltip?.position ?? {};

    const checkSeriesType = (type?: string) => {
        if (type != null && !(isSeriesOptionType(type) || getSeriesDefaults(type))) {
            throw new Error(`AG Charts - unknown series type: ${type}; expected one of: ${CHART_TYPES.seriesTypes}`);
        }
    };
    checkSeriesType(type);
    for (const { type: seriesType } of options.series ?? []) {
        if (seriesType == null) continue;
        checkSeriesType(seriesType);
    }

    options = { ...options, type };

    let defaultSeriesType = 'line';
    if (isAgCartesianChartOptions(options)) {
        defaultSeriesType = 'line';
    } else if (isAgHierarchyChartOptions(options)) {
        defaultSeriesType = 'treemap';
    } else if (isAgPolarChartOptions(options)) {
        defaultSeriesType = 'pie';
    }

    let defaultOverrides = getSeriesDefaults(type);
    if (isDefaultAxisSwapNeeded(options)) {
        defaultOverrides = swapAxes(defaultOverrides);
    }
    defaultOverrides = resolveModuleConflicts(options, defaultOverrides);

    removeDisabledOptions<T>(options);

    const { context, mergedOptions, axesThemes, seriesThemes, theme } = prepareMainOptions<T>(
        defaultOverrides as T,
        options
    );

    // Special cases where we have arrays of elements which need their own defaults.

    // Apply series themes before calling processSeriesOptions() as it reduces and renames some
    // properties, and in that case then cannot correctly have themes applied.
    mergedOptions.series = processSeriesOptions(
        mergedOptions,
        ((mergedOptions.series as SeriesOptions[]) ?? []).map((s) => {
            let type = defaultSeriesType;
            if (s.type) {
                type = s.type;
            }

            const mergedSeries = mergeSeriesOptions(s, type, seriesThemes, globalTooltipPositionOptions);

            if (type === 'pie') {
                preparePieOptions(seriesThemes.pie, s, mergedSeries);
            }
            return mergedSeries;
        })
    )
        .map((s) => prepareSeries(context, s))
        .map((s) => theme.templateTheme(s)) as any[];

    const checkAxisType = (type?: string) => {
        const isAxisType = isAxisOptionType(type);
        if (!isAxisType) {
            Logger.warnOnce(`unknown axis type: ${type}; expected one of: ${AXIS_TYPES.axesTypes}, ignoring.`);
        }

        return isAxisType;
    };

    if ('axes' in mergedOptions) {
        let validAxesTypes = true;
        for (const { type: axisType } of mergedOptions.axes ?? []) {
            validAxesTypes = validAxesTypes && checkAxisType(axisType);
        }

        const axisSource = validAxesTypes ? mergedOptions.axes : (defaultOverrides as AgCartesianChartOptions).axes;
        mergedOptions.axes = axisSource?.map((axis: any) => {
            const axisType = axis.type;
            let axisDefaults: {} | undefined;
            if (validAxesTypes) {
                axisDefaults = (defaultOverrides as AgCartesianChartOptions).axes?.find(
                    ({ type }) => type === axisType
                );
            }
            const axesTheme = jsonMerge([
                axesThemes[axisType] ?? {},
                axesThemes[axisType]?.[axis.position ?? 'unknown'] ?? {},
                axisDefaults,
            ]);
            return prepareAxis(axis, axesTheme);
        });
        prepareLegendEnabledOption<T>(options, mergedOptions);
    }

    prepareEnabledOptions<T>(options, mergedOptions);

    return mergedOptions;
}

function sanityCheckOptions<T extends AgChartOptions>(options: T) {
    const deprecatedArrayProps = {
        yKeys: 'yKey',
        yNames: 'yName',
    };
    Object.entries(deprecatedArrayProps).forEach(([oldProp, newProp]) => {
        if (options.series?.some((s: any) => s[oldProp] != null)) {
            Logger.warnOnce(
                `property [series.${oldProp}] is deprecated, please use [series.${newProp}] and multiple series instead.`
            );
        }
    });
}

function mergeSeriesOptions<T extends SeriesOptionsTypes>(
    series: T,
    type: string,
    seriesThemes: any,
    globalTooltipPositionOptions: AgTooltipPositionOptions | {}
): T {
    const mergedTooltipPosition = jsonMerge(
        [{ ...globalTooltipPositionOptions }, series.tooltip?.position],
        noDataCloneMergeOptions
    );
    return jsonMerge(
        [
            seriesThemes[type] ?? {},
            { ...series, type, tooltip: { ...series.tooltip, position: mergedTooltipPosition } },
        ],
        noDataCloneMergeOptions
    );
}

function prepareMainOptions<T extends AgChartOptions>(defaultOverrides: T, options: T) {
    const { theme, cleanedTheme, axesThemes, seriesThemes, userPalette } = prepareTheme(options);

    const context: PreparationContext = { colourIndex: 0, palette: theme.palette, userPalette, theme };

    defaultOverrides = theme.templateTheme(defaultOverrides);
    const mergedOptions: T = jsonMerge([defaultOverrides, cleanedTheme, options], noDataCloneMergeOptions);

    return { context, mergedOptions, axesThemes, seriesThemes, theme };
}

function prepareTheme<T extends AgChartOptions>(options: T) {
    const theme = getChartTheme(options.theme);
    const themeConfig = theme.config[optionsType(options)];

    const seriesThemes = Object.entries<any>(theme.config).reduce((result, [seriesType, { series }]) => {
        result[seriesType] = series;
        return result;
    }, {} as any);

    const userTheme = options.theme;
    const userPalette = typeof userTheme === 'object' && userTheme.palette ? userTheme.palette : null;

    return {
        theme,
        axesThemes: themeConfig['axes'] ?? {},
        seriesThemes: seriesThemes,
        cleanedTheme: jsonMerge([themeConfig, { axes: DELETE, series: DELETE }]),
        userPalette,
    };
}

function prepareSeries<T extends SeriesOptionsTypes>(context: PreparationContext, input: T, ...defaults: T[]): T {
    const paletteOptions = calculateSeriesPalette(context, input);

    // Part of the options interface, but not directly consumed by the series implementations.
    const removeOptions = { stacked: DELETE, grouped: DELETE } as any;
    return jsonMerge([...defaults, paletteOptions, input, removeOptions], noDataCloneMergeOptions);
}

function calculateSeriesPalette<T extends SeriesOptionsTypes>(context: PreparationContext, input: T): T {
    const paletteFactory = getSeriesPaletteFactory(input.type!);
    if (!paletteFactory) {
        return {} as T;
    }

    const {
        palette: { fills, strokes },
        userPalette,
        theme,
    } = context;

    const colorsCount = Math.max(fills.length, strokes.length);
    return paletteFactory({
        userPalette,
        themeTemplateParameters: theme.getTemplateParameters(),
        colorsCount,
        takeColors: (count) => {
            const colors = {
                fills: takeColours(context, fills, count),
                strokes: takeColours(context, strokes, count),
            };
            context.colourIndex += count;
            return colors;
        },
    }) as T;
}

function prepareAxis<T extends AxesOptionsTypes>(
    axis: T,
    axisTheme: Omit<T, 'crossLines'> & { crossLines: AgCartesianCrossLineOptions }
): T {
    // Remove redundant theme overload keys.
    const removeOptions = { top: DELETE, bottom: DELETE, left: DELETE, right: DELETE } as any;

    // Special cross lines case where we have an array of cross line elements which need their own defaults.
    if (axis.crossLines) {
        if (!Array.isArray(axis.crossLines)) {
            Logger.warn('axis[].crossLines should be an array.');
            axis.crossLines = [];
        }

        const { crossLines: crossLinesTheme } = axisTheme;
        axis.crossLines = axis.crossLines.map((crossLine) => jsonMerge([crossLinesTheme, crossLine]));
    }

    const cleanTheme = { crossLines: DELETE };

    return jsonMerge([axisTheme, cleanTheme, axis, removeOptions], noDataCloneMergeOptions);
}

function removeDisabledOptions<T extends AgChartOptions>(options: T) {
    // Remove configurations from all option objects with a `false` value for the `enabled` property.
    jsonWalk(
        options,
        (_, visitingUserOpts) => {
            if (!('enabled' in visitingUserOpts)) return;
            if (visitingUserOpts.enabled === false) {
                Object.entries(visitingUserOpts).forEach(([key]) => {
                    if (key === 'enabled') return;
                    delete visitingUserOpts[key];
                });
            }
        },
        { skip: ['data', 'theme'] }
    );
}

function prepareLegendEnabledOption<T extends AgChartOptions>(options: T, mergedOptions: any) {
    // Disable legend by default for single series cartesian charts
    if (options.legend?.enabled !== undefined || mergedOptions.legend?.enabled !== undefined) {
        return;
    }
    mergedOptions.legend ??= {};
    if ((options.series ?? []).length > 1) {
        mergedOptions.legend.enabled = true;
        return;
    }
    mergedOptions.legend.enabled = false;
}

function prepareEnabledOptions<T extends AgChartOptions>(options: T, mergedOptions: any) {
    // Set `enabled: true` for all option objects where the user has provided values.
    jsonWalk(
        options,
        (_, visitingUserOpts, visitingMergedOpts) => {
            if (!visitingMergedOpts) return;

            const { _enabledFromTheme } = visitingMergedOpts;
            if (_enabledFromTheme != null) {
                // Do not apply special handling, base enablement on theme.
                delete visitingMergedOpts._enabledFromTheme;
            }

            if (!('enabled' in visitingMergedOpts)) return;
            if (_enabledFromTheme) return;

            if (visitingUserOpts.enabled == null) {
                visitingMergedOpts.enabled = true;
            }
        },
        { skip: ['data', 'theme'] },
        mergedOptions
    );

    // Cleanup any special properties.
    jsonWalk(
        mergedOptions,
        (_, visitingMergedOpts) => {
            if (visitingMergedOpts._enabledFromTheme != null) {
                // Do not apply special handling, base enablement on theme.
                delete visitingMergedOpts._enabledFromTheme;
            }
        },
        { skip: ['data', 'theme'] }
    );
}

function preparePieOptions(pieSeriesTheme: any, seriesOptions: any, mergedSeries: any) {
    if (Array.isArray(seriesOptions.innerLabels)) {
        mergedSeries.innerLabels = seriesOptions.innerLabels.map((ln: any) => {
            return jsonMerge([pieSeriesTheme.innerLabels, ln]);
        });
    } else {
        mergedSeries.innerLabels = DELETE;
    }
}
