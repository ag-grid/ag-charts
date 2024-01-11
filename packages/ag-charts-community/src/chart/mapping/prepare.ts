import { ChartOptions } from '../../module/optionModules';
import type {
    AgAxisGridLineOptions,
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartOptions,
    AgChartThemePalette,
} from '../../options/agChartOptions';
import { jsonWalk } from '../../util/json';
import { Logger } from '../../util/logger';
import { mergeDefaults } from '../../util/object';
import { isArray, isDefined } from '../../util/type-guards';
import { AXIS_TYPES } from '../factory/axisTypes';
import { getSeriesPaletteFactory } from '../factory/seriesTypes';
import { type ChartTheme, resolvePartialPalette } from '../themes/chartTheme';
import { processSeriesOptions } from './prepareSeries';
import { type AxesOptionsTypes, type SeriesOptionsTypes, isAxisOptionType, optionsType } from './types';

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

export function prepareOptions<T extends AgChartOptions>(userOptions: T): T {
    const chartOptions = new ChartOptions();
    chartOptions.setUserOptions(userOptions);

    const options = chartOptions.userOptions!;
    const theme = chartOptions.activeTheme!;

    const themeConfig = chartOptions.getSeriesThemeConfig(optionsType(options));

    const userTheme = options.theme;
    const partialPalette = typeof userTheme === 'object' && userTheme.palette ? userTheme.palette : null;

    const axesThemes = themeConfig?.['axes'] ?? {};

    const defaultOverrides = chartOptions.seriesDefaults!;
    const mergedOptions = chartOptions.processedOptions! as T;

    const context: PreparationContext = {
        colourIndex: 0,
        palette: theme.palette,
        userPalette: resolvePartialPalette(partialPalette, theme.palette),
        theme,
    };

    // Special cases where we have arrays of elements which need their own defaults.

    // Apply series themes before calling processSeriesOptions() as it reduces and renames some
    // properties, and in that case then cannot correctly have themes applied.
    mergedOptions.series = processSeriesOptions(chartOptions).map((s) => {
        const { stacked, grouped, ...seriesOptions } = mergeDefaults(s, calculateSeriesPalette(context, s)) as any;
        return theme.templateTheme(seriesOptions);
    }) as any[];

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
            const axesTheme = mergeDefaults(
                axisDefaults,
                axesThemes[axisType]?.[axis.position ?? 'unknown'],
                axesThemes[axisType]
            );
            return prepareAxis(axis, axesTheme);
        });
        prepareLegendEnabledOption(options, mergedOptions);
    }

    prepareEnabledOptions(options, mergedOptions);

    return mergedOptions;
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
    // Special cross lines case where we have an array of cross line elements which need their own defaults.
    if (axis.crossLines) {
        if (!isArray(axis.crossLines)) {
            Logger.warn('axis[].crossLines should be an array.');
            axis.crossLines = [];
        }
        axis.crossLines = axis.crossLines.map((crossLine) => mergeDefaults(crossLine, axisTheme.crossLines));
    }

    // Same thing grid lines (AG-8777)
    const gridLineStyle = axisTheme.gridLine.style;
    if (axis.gridLine?.style !== undefined && gridLineStyle !== undefined && gridLineStyle.length > 0) {
        if (!isArray(axis.gridLine.style)) {
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
            return mergeDefaults(userStyle, themeStyle);
        });
    }

    delete (axisTheme as any).crossLines;
    const { top, right, bottom, left, ...axisOptions } = mergeDefaults(axis, axisTheme) as any;
    return axisOptions;
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
