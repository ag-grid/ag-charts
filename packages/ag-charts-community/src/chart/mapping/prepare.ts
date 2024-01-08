import { enterpriseModule } from '../../module/enterpriseModule';
import { ChartOptions } from '../../module/optionModules';
import type {
    AgAxisGridLineOptions,
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartOptions,
    AgChartThemePalette,
    AgTooltipPositionOptions,
    AgTooltipPositionType,
} from '../../options/agChartOptions';
import { DELETE, type JsonMergeOptions, jsonMerge, jsonWalk } from '../../util/json';
import { Logger } from '../../util/logger';
import { isArray, isDefined } from '../../util/type-guards';
import { AXIS_TYPES } from '../factory/axisTypes';
import { removeUsedEnterpriseOptions } from '../factory/processEnterpriseOptions';
import { getSeriesPaletteFactory } from '../factory/seriesTypes';
import { type ChartTheme, resolvePartialPalette } from '../themes/chartTheme';
import type { SeriesOptions } from './prepareSeries';
import { processSeriesOptions } from './prepareSeries';
import {
    type AxesOptionsTypes,
    type SeriesOptionsTypes,
    isAgCartesianChartOptions,
    isAgHierarchyChartOptions,
    isAgPolarChartOptions,
    isAxisOptionType,
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
    const AgTooltipPositionTypeMap: { [K in AgTooltipPositionType]: true } = { pointer: true, node: true };
    const result: AgTooltipPositionOptions = {};

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

export function prepareOptions<T extends AgChartOptions>(userOptions: T): T {
    const chartOptions = new ChartOptions();
    chartOptions.setUserOptions(userOptions);

    const options = chartOptions.userOptions!;
    const theme = chartOptions.activeTheme!;

    const themeConfig = theme.config[optionsType(options)];

    const seriesThemes = Object.entries<any>(theme.config).reduce((result, [seriesType, { series }]) => {
        result[seriesType] = series;
        return result;
    }, {} as any);

    const userTheme = options.theme;
    const partialPalette = typeof userTheme === 'object' && userTheme.palette ? userTheme.palette : null;

    const axesThemes = themeConfig?.['axes'] ?? {};
    const cleanedTheme = jsonMerge([themeConfig ?? {}, { axes: DELETE, series: DELETE }]);

    const defaultOverrides = chartOptions.seriesDefaults!;

    const mergedOptions = jsonMerge([defaultOverrides, cleanedTheme, options], noDataCloneMergeOptions) as T;
    // const mergedOptions = mergeDefaults(options, cleanedTheme, defaultOverrides) as T;

    if (!enterpriseModule.isEnterprise) {
        removeUsedEnterpriseOptions(mergedOptions);
    }

    const globalTooltipPositionOptions = getGlobalTooltipPositionOptions(options.tooltip?.position);

    let defaultSeriesType: string;
    if (isAgCartesianChartOptions(options)) {
        defaultSeriesType = 'line';
    } else if (isAgHierarchyChartOptions(options)) {
        defaultSeriesType = 'treemap';
    } else if (isAgPolarChartOptions(options)) {
        defaultSeriesType = 'pie';
    }

    const context: PreparationContext = {
        colourIndex: 0,
        palette: theme.palette,
        userPalette: resolvePartialPalette(partialPalette, theme.palette),
        theme,
    };

    // Special cases where we have arrays of elements which need their own defaults.

    // Apply series themes before calling processSeriesOptions() as it reduces and renames some
    // properties, and in that case then cannot correctly have themes applied.
    mergedOptions.series = processSeriesOptions(
        mergedOptions,
        (mergedOptions.series as SeriesOptions[]).map((s) => {
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

function mergeSeriesOptions<T extends SeriesOptionsTypes>(
    series: T,
    type: string,
    seriesThemes: any,
    globalTooltipPositionOptions: AgTooltipPositionOptions | {}
): T {
    const mergedTooltipPosition = jsonMerge(
        [globalTooltipPositionOptions, series.tooltip?.position],
        noDataCloneMergeOptions
    );
    return jsonMerge(
        [seriesThemes[type], series, { type, tooltip: { position: mergedTooltipPosition } }],
        noDataCloneMergeOptions
    );
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

function prepareLegendEnabledOption<T extends AgChartOptions>(options: T, mergedOptions: any) {
    // Disable legend by default for single series cartesian charts
    if (!isDefined(options.legend?.enabled) && !isDefined(mergedOptions.legend?.enabled)) {
        mergedOptions.legend ??= {};
        mergedOptions.legend.enabled = (options.series ?? []).length > 1;
    }
}

function prepareEnabledOptions<T extends AgChartOptions>(options: T, mergedOptions: any) {
    // Set `enabled: true` for all option objects where the user has provided values.
    jsonWalk(
        options,
        (visitingUserOpts, visitingMergedOpts) => {
            if (
                visitingMergedOpts &&
                'enabled' in visitingMergedOpts &&
                !visitingMergedOpts._enabledFromTheme &&
                visitingUserOpts.enabled == null
            ) {
                visitingMergedOpts.enabled = true;
            }
        },
        { skip: ['data', 'theme'] },
        mergedOptions
    );

    // Cleanup any special properties.
    jsonWalk(
        mergedOptions,
        (visitingMergedOpts) => {
            if (visitingMergedOpts._enabledFromTheme != null) {
                // Do not apply special handling, base enablement on theme.
                delete visitingMergedOpts._enabledFromTheme;
            }
        },
        { skip: ['data', 'theme'] }
    );
}

function preparePieOptions(pieSeriesTheme: any, seriesOptions: any, mergedSeries: any) {
    if (isArray(seriesOptions.innerLabels)) {
        mergedSeries.innerLabels = seriesOptions.innerLabels.map((innerLabel: any) =>
            jsonMerge([pieSeriesTheme.innerLabels, innerLabel])
        );
    } else {
        mergedSeries.innerLabels = DELETE;
    }
}
