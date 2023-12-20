import { enterpriseModule } from '../../module/enterpriseModule';
import type {
    AgAxisGridLineOptions,
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartOptions,
    AgChartThemePalette,
    AgTooltipPositionOptions,
    AgTooltipPositionType,
} from '../../options/agChartOptions';
import type { JsonMergeOptions } from '../../util/json';
import { DELETE, jsonMerge, jsonWalk } from '../../util/json';
import { Logger } from '../../util/logger';
import type { DeepPartial } from '../../util/types';
import { AXIS_TYPES } from '../factory/axisTypes';
import { CHART_TYPES } from '../factory/chartTypes';
import { isEnterpriseSeriesType } from '../factory/expectedEnterpriseModules';
import { removeUsedEnterpriseOptions } from '../factory/processEnterpriseOptions';
import {
    executeCustomDefaultsFunctions,
    getSeriesDefaults,
    getSeriesPaletteFactory,
    isDefaultAxisSwapNeeded,
    isSoloSeries,
} from '../factory/seriesTypes';
import { type ChartTheme, resolvePartialPalette } from '../themes/chartTheme';
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

function getGlobalTooltipPositionOptions(position: unknown): AgTooltipPositionOptions {
    // Note: we do not need to show a warning message if the validation fails. These global tooltip options
    // are already processed at the root of the chart options. Logging a message here would trigger duplicate
    // validation warnings.
    if (position === undefined || typeof position !== 'object' || position === null) {
        return {};
    }
    const { type, xOffset, yOffset } = position as { type?: unknown; xOffset?: unknown; yOffset?: unknown };

    const result: AgTooltipPositionOptions = {};

    const AgTooltipPositionTypeMap: { [K in AgTooltipPositionType]: true } = { pointer: true, node: true };
    const isTooltipPositionType = (value: string): value is AgTooltipPositionType =>
        Object.keys(AgTooltipPositionTypeMap).includes(value);
    if (typeof type === 'string' && isTooltipPositionType(type)) {
        result.type = type;
    }
    if (typeof xOffset === 'number' && !isNaN(xOffset) && isFinite(xOffset)) {
        result.xOffset = xOffset;
    }
    if (typeof yOffset === 'number' && !isNaN(yOffset) && isFinite(yOffset)) {
        result.yOffset = yOffset;
    }
    return result;
}

export function prepareOptions<T extends AgChartOptions>(options: T): T {
    sanityCheckOptions(options);

    // Determine type and ensure it's explicit in the options config.
    const type = optionsType(options);

    const globalTooltipPositionOptions = getGlobalTooltipPositionOptions(options.tooltip?.position);

    const checkSeriesType = (type?: string) => {
        if (type != null && !(isSeriesOptionType(type) || isEnterpriseSeriesType(type) || getSeriesDefaults(type))) {
            throw new Error(`AG Charts - unknown series type: ${type}; expected one of: ${CHART_TYPES.seriesTypes}`);
        }
    };
    checkSeriesType(type);
    for (const { type: seriesType } of options.series ?? []) {
        if (seriesType == null) continue;
        checkSeriesType(seriesType);
    }

    options = validateSoloSeries({ ...options, type });

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
    defaultOverrides = executeCustomDefaultsFunctions(options, defaultOverrides);

    const conflictOverrides = resolveModuleConflicts(options);

    removeDisabledOptions(options);

    const { context, mergedOptions, axesThemes, seriesThemes, theme } = prepareMainOptions<T>(
        defaultOverrides as T,
        options,
        conflictOverrides
    );

    // Special cases where we have arrays of elements which need their own defaults.

    // Apply series themes before calling processSeriesOptions() as it reduces and renames some
    // properties, and in that case then cannot correctly have themes applied.
    mergedOptions.series = processSeriesOptions(
        mergedOptions,
        ((mergedOptions.series as SeriesOptions[]) ?? []).map((s) => {
            const type = s.type ?? defaultSeriesType;
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
            validAxesTypes &&= checkAxisType(axisType);
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
        prepareLegendEnabledOption(options, mergedOptions);
    }

    prepareEnabledOptions(options, mergedOptions);

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
                `Property [series.${oldProp}] is deprecated, please use [series.${newProp}] and multiple series instead.`
            );
        }
    });
}

function hasSoloSeries(options: SeriesOptionsTypes[]) {
    for (const series of options) {
        if (isSoloSeries(series.type)) return true;
    }
    return false;
}

function validateSoloSeries<T extends AgChartOptions>(options: T): T {
    if (options.series === undefined || options.series.length <= 1 || !hasSoloSeries(options.series)) {
        return options;
    }

    // If the first series is a solo-series, remove all trailing series.
    // If the frist series is not a solo-series, remove all solo-series.
    let series = [...options.series];
    if (isSoloSeries(series[0].type)) {
        Logger.warn(
            `series[0] of type '${series[0].type}' is incompatible with other series types. Only processing series[0]`
        );
        series = series.slice(0, 1);
    } else {
        const rejects = Array.from(new Set(series.filter((s) => isSoloSeries(s.type)).map((s) => s.type)));
        Logger.warnOnce(`Unable to mix these series types with the lead series type: ${rejects}`);

        series = series.filter((s) => !isSoloSeries(s.type));
    }

    return { ...options, series };
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

function prepareMainOptions<T extends AgChartOptions>(
    defaultOverrides: T,
    options: T,
    conflictOverrides: DeepPartial<T>
) {
    const { theme, cleanedTheme, axesThemes, seriesThemes, userPalette: partialPalette } = prepareTheme(options);

    const userPalette = resolvePartialPalette(partialPalette, theme.palette);
    const context: PreparationContext = { colourIndex: 0, palette: theme.palette, userPalette, theme };

    defaultOverrides = theme.templateTheme(defaultOverrides);
    const mergedOptions: T = jsonMerge(
        [defaultOverrides, cleanedTheme, options, conflictOverrides],
        noDataCloneMergeOptions
    );

    if (!enterpriseModule.isEnterprise) {
        removeUsedEnterpriseOptions(mergedOptions);
    }

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
        axesThemes: themeConfig?.['axes'] ?? {},
        seriesThemes: seriesThemes,
        cleanedTheme: jsonMerge([themeConfig ?? {}, { axes: DELETE, series: DELETE }]),
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
    axisTheme: { crossLines: AgCartesianCrossLineOptions; gridLine: AgAxisGridLineOptions }
): T {
    // Remove redundant theme overload keys.
    const removeOptions = { top: DELETE, bottom: DELETE, left: DELETE, right: DELETE } as any;

    // Special cross lines case where we have an array of cross line elements which need their own defaults.
    if (axis.crossLines) {
        if (!Array.isArray(axis.crossLines)) {
            Logger.warn('axis[].crossLines should be an array.');
            axis.crossLines = [];
        }
        axis.crossLines = axis.crossLines.map((crossLine) => jsonMerge([axisTheme.crossLines, crossLine]));
    }

    // Same thing grid lines (AG-8777)
    const gridLineStyle = axisTheme.gridLine.style;
    if (axis.gridLine?.style !== undefined && gridLineStyle !== undefined && gridLineStyle.length > 0) {
        if (!Array.isArray(axis.gridLine.style)) {
            Logger.warn('axis[].gridLine.style should be an array.');
            axis.gridLine.style = [];
        }
        axis.gridLine.style = axis.gridLine.style.map((userStyle, index) => {
            // An empty gridLine (e.g. `gridLine: { style: [ {} ] }`) means "draw nothing". So ignore theme
            // defaults if this is the case:
            if (userStyle.stroke === undefined && userStyle.lineDash === undefined) {
                return userStyle;
            }
            // Themes will normally only have one element in gridLineStyle[], but cycle through the array
            // with `mod` anyway to make sure that we honour the theme's grid line style sequence.
            const themeStyle: typeof userStyle = gridLineStyle[index % gridLineStyle.length];
            return jsonMerge([themeStyle, userStyle]);
        });
    }

    const cleanTheme = { crossLines: DELETE };

    return jsonMerge([axisTheme, cleanTheme, axis, removeOptions], noDataCloneMergeOptions);
}

function removeDisabledOptions<T extends AgChartOptions>(options: T) {
    // Remove configurations from all option objects with a `false` value for the `enabled` property.
    jsonWalk(
        options,
        (_, visitingUserOpts) => {
            if (visitingUserOpts.enabled === false) {
                Object.keys(visitingUserOpts).forEach((key) => {
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
        mergedSeries.innerLabels = seriesOptions.innerLabels.map((innerLabel: any) =>
            jsonMerge([pieSeriesTheme.innerLabels, innerLabel])
        );
    } else {
        mergedSeries.innerLabels = DELETE;
    }
}
