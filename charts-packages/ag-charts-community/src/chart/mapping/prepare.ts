import { AgChartOptions, AgHierarchyChartOptions, AgPolarChartOptions, AgCartesianChartOptions, AgChartThemePalette } from "../agChartOptions";
import { CartesianChart } from "../cartesianChart";
import { PolarChart } from "../polarChart";
import { HierarchyChart } from "../hierarchyChart";
import { SeriesOptionsTypes, DEFAULT_CARTESIAN_CHART_OVERRIDES, DEFAULT_BAR_CHART_OVERRIDES, DEFAULT_SCATTER_HISTOGRAM_CHART_OVERRIDES } from "./defaults";
import { jsonMerge, DELETE, jsonWalk } from "../../util/json";
import { applySeriesTransform } from "./transforms";
import { getChartTheme } from "./themes";
import { processSeriesOptions } from "./prepareSeries";

export type ChartType = CartesianChart | PolarChart | HierarchyChart;
export type AxesOptionsTypes = NonNullable<AgCartesianChartOptions['axes']>[number];

export function optionsType(
    input: { type?: AgChartOptions['type'], series?: { type?: SeriesOptionsTypes['type']}[]}
): NonNullable<AgChartOptions['type']> {
    return input.type || input.series?.[0]?.type || 'cartesian';
}

export function isAgCartesianChartOptions(input: AgChartOptions): input is AgCartesianChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return true;
    }

    switch (specifiedType) {
        case 'cartesian':
        case 'area':
        case 'bar':
        case 'column':
        case 'groupedCategory':
        case 'histogram':
        case 'line':
        case 'scatter':
            return true;

        default:
            return false;
    }
}

export function isAgHierarchyChartOptions(input: AgChartOptions): input is AgHierarchyChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }

    switch (input.type) {
        case 'hierarchy':
            // fall-through - hierarchy and treemap are synonyms.
        case 'treemap':
            return true;

        default:
            return false;
    }
}

export function isAgPolarChartOptions(input: AgChartOptions): input is AgPolarChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }

    switch (input.type) {
        case 'polar':
            // fall-through - polar and pie are synonyms.
        case 'pie':
            return true;

        default:
            return false;
    }
}

export function isSeriesOptionType(input?: string): input is NonNullable<SeriesOptionsTypes['type']> {
    if (input == null) { return false; }
    return ['line', 'bar', 'column', 'histogram', 'scatter', 'area', 'pie', 'treemap'].indexOf(input) >= 0;
}

function countArrayElements<T extends any[]|any[][]>(input: T): number {
    let count = 0;
    for (const next of input) {
        if (next instanceof Array) {
            count += countArrayElements(next);
        }
        if (next != null) {
            count++;
        }
    }
    return count;
}

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
}

export function prepareOptions<T extends AgChartOptions>(newOptions: T, ...fallbackOptions: T[]): T {
    let options: T = fallbackOptions == null ? newOptions : jsonMerge(...fallbackOptions, newOptions);
    sanityCheckOptions(options);

    // Determine type and ensure it's explicit in the options config.
    const userSuppliedOptionsType = options.type;
    const type = optionsType(options);
    options = {...options, type };

    const defaultSeriesType = isAgCartesianChartOptions(options) ? 'line' :
        isAgHierarchyChartOptions(options) ? 'treemap' :
        isAgPolarChartOptions(options) ? 'pie' :
        'line';

    const defaultOverrides =
        type === 'bar' ? DEFAULT_BAR_CHART_OVERRIDES :
        type === 'scatter' ? DEFAULT_SCATTER_HISTOGRAM_CHART_OVERRIDES :
        type === 'histogram' ? DEFAULT_SCATTER_HISTOGRAM_CHART_OVERRIDES :
        isAgCartesianChartOptions(options) ? DEFAULT_CARTESIAN_CHART_OVERRIDES :
        {};

    const { context, mergedOptions, axesThemes, seriesThemes } =
        prepareMainOptions<T>(defaultOverrides as T, options);

    // Special cases where we have arrays of elements which need their own defaults.
    mergedOptions.series = processSeriesOptions(mergedOptions.series || [])
        .map((s: SeriesOptionsTypes) => {
            const type = s.type ? s.type :
                isSeriesOptionType(userSuppliedOptionsType) ? userSuppliedOptionsType :
                defaultSeriesType;
            const series = { ...s, type };
            return prepareSeries(context, series, seriesThemes[type] || {});
        });
    if (isAgCartesianChartOptions(mergedOptions)) {
        (mergedOptions.axes || []).forEach((a, i) => {
            const type = a.type || 'number';
            const axis = { ...a, type };
            const axesTheme = jsonMerge(axesThemes[type], axesThemes[type][a.position || 'unknown'] || {});
            mergedOptions.axes![i] = prepareAxis(axis, axesTheme);
        });
    }

    prepareEnabledOptions<T>(options, mergedOptions);

    return mergedOptions;
}

function sanityCheckOptions<T extends AgChartOptions>(options: T) {
    if (options.series?.some((s: any) => s.yKeys != null && s.yKey != null )) {
        console.warn('AG Charts - series options yKeys and yKey are mutually exclusive, please only use yKey for future compatibility.');
    }

    if (options.series?.some((s: any) => s.yNames != null && s.yName != null )) {
        console.warn('AG Charts - series options yNames and yName are mutually exclusive, please only use yName for future compatibility.');
    }
}

function prepareMainOptions<T>(defaultOverrides: T, options: T): { context: PreparationContext, mergedOptions: T; axesThemes: any; seriesThemes: any; } {
    const { theme, cleanedTheme, axesThemes, seriesThemes } = prepareTheme(options);
    const context: PreparationContext = { colourIndex: 0, palette: theme.palette };        
    const mergedOptions = jsonMerge(defaultOverrides, cleanedTheme, options);

    return { context, mergedOptions, axesThemes, seriesThemes };
}

function prepareTheme<T extends AgChartOptions>(options: T) {
    const theme = getChartTheme(options.theme);
    const themeConfig = theme.getConfig(optionsType(options) || 'cartesian');
    return {
        theme,
        axesThemes: themeConfig['axes'] || {},
        seriesThemes: themeConfig['series'] || {},
        cleanedTheme: jsonMerge(themeConfig, { axes: DELETE, series: DELETE }),
    };
}

function prepareSeries<T extends SeriesOptionsTypes>(context: PreparationContext, input: T, ...defaults: T[]): T {
    const paletteOptions = calculateSeriesPalette(context, input);

    // Part of the options interface, but not directly consumed by the series implementations.
    const removeOptions = { stacked: DELETE } as T;
    const mergedResult = jsonMerge(...defaults, paletteOptions, input, removeOptions);

    return applySeriesTransform(mergedResult);
}

function calculateSeriesPalette<T extends SeriesOptionsTypes>(context: PreparationContext, input: T): T {
    let paletteOptions: {
        stroke?: string;
        fill?: string;
        fills?: string[];
        strokes?: string[];
        marker?: { fill?: string; stroke?: string; };
        callout?: { colors?: string[]; };
    } = {};

    const { palette: { fills, strokes } } = context;
    
    const inputAny = (input as any);
    let colourCount = countArrayElements(inputAny['yKeys'] || []) || 1; // Defaults to 1 if no yKeys.
    switch (input.type) {
        case 'pie':
            colourCount = Math.max(fills.length, strokes.length);
            // fall-through - only colourCount varies for `pie`.
        case 'area':
        case 'bar':
        case 'column':
            paletteOptions.fills = takeColours(context, fills, colourCount);
            paletteOptions.strokes = takeColours(context, strokes, colourCount);
            break;
        case 'histogram':
            paletteOptions.fill = takeColours(context, fills, 1)[0];
            paletteOptions.stroke = takeColours(context, strokes, 1)[0];
            break;
        case 'scatter':
            paletteOptions.marker = {
                stroke: takeColours(context, strokes, 1)[0],
                fill: takeColours(context, fills, 1)[0],
            };
            break;
        case 'line':
            paletteOptions.stroke = takeColours(context, fills, 1)[0];
            paletteOptions.marker = {
                stroke: takeColours(context, strokes, 1)[0],
                fill: takeColours(context, fills, 1)[0],
            };
            break;
        case 'treemap':
            break;
        default:
            throw new Error('AG Charts - unknown series type: ' + input.type);
    }
    context.colourIndex += colourCount;

    return paletteOptions as T;
}

function prepareAxis<T extends AxesOptionsTypes>(input: T, ...defaults: T[]): T {
    // Remove redundant theme overload keys.
    const removeOptions = { top: DELETE, bottom: DELETE, left: DELETE, right: DELETE } as any;
    return jsonMerge(...defaults, input, removeOptions);
}

function prepareEnabledOptions<T extends AgChartOptions>(options: T, mergedOptions: any) {
    // Set `enabled: true` for all option objects where the user has provided values.
    jsonWalk(options, (_, userOpts, mergedOpts) => {
        if (!mergedOpts) {
            return;
        }
        if ('enabled' in mergedOpts && userOpts.enabled == null) {
            mergedOpts.enabled = true;
        }
    }, { skip: ['data'] }, mergedOptions);
}
