import type {
    AgChartTheme,
    AgChartThemeOptions,
    AgChartThemeOverrides,
    AgChartThemePalette,
    AgCommonThemeableChartOptions,
} from 'ag-charts-types';

import { deepClone, jsonWalk } from '../../util/json';
import { mergeDefaults } from '../../util/object';
import { isArray } from '../../util/type-guards';
import { axisRegistry } from '../factory/axisRegistry';
import { type ChartType, chartDefaults, chartTypes } from '../factory/chartTypes';
import { legendRegistry } from '../factory/legendRegistry';
import { seriesRegistry } from '../factory/seriesRegistry';
import { CARTESIAN_AXIS_TYPE, FONT_SIZE, FONT_WEIGHT, POLAR_AXIS_TYPE, POSITION } from './constants';
import { DEFAULT_FILLS, DEFAULT_STROKES, type DefaultColors } from './defaultColors';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_HANDLE_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_AXIS_LINE_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
    DEFAULT_COLOURS,
    DEFAULT_CROSS_LINES_COLOUR,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_FONT_FAMILY,
    DEFAULT_HIERARCHY_FILLS,
    DEFAULT_HIERARCHY_STROKES,
    DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
    DEFAULT_INVERTED_LABEL_COLOUR,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    DEFAULT_POLAR_SERIES_STROKE,
    DEFAULT_SHADOW_COLOUR,
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
    IS_DARK_THEME,
} from './symbols';

// If this changes, update plugins/ag-charts-generate-chart-thumbnail/src/executors/generate/generator/constants.ts
const DEFAULT_BACKGROUND_FILL = 'white';

const DEFAULT_PALETTE: AgChartThemePalette = {
    fills: Object.values(DEFAULT_FILLS),
    strokes: Object.values(DEFAULT_STROKES),
};

type ChartTypeConfig = {
    seriesTypes: string[];
    commonOptions: (keyof AgCommonThemeableChartOptions)[];
};

const CHART_TYPE_CONFIG: { [k in ChartType]: ChartTypeConfig } = {
    get cartesian(): ChartTypeConfig {
        return { seriesTypes: chartTypes.cartesianTypes, commonOptions: ['zoom', 'navigator'] };
    },
    get polar(): ChartTypeConfig {
        return { seriesTypes: chartTypes.polarTypes, commonOptions: [] };
    },
    get hierarchy(): ChartTypeConfig {
        return { seriesTypes: chartTypes.hierarchyTypes, commonOptions: [] };
    },
    get topology(): ChartTypeConfig {
        return { seriesTypes: chartTypes.topologyTypes, commonOptions: [] };
    },
    get 'flow-proportion'(): ChartTypeConfig {
        return { seriesTypes: chartTypes.flowProportionTypes, commonOptions: [] };
    },
};

const CHART_TYPE_SPECIFIC_COMMON_OPTIONS = Object.values(CHART_TYPE_CONFIG).reduce<
    (keyof AgCommonThemeableChartOptions)[]
>((r, { commonOptions }) => r.concat(commonOptions), []);

export class ChartTheme {
    readonly palette: AgChartThemePalette;

    protected getPalette(): AgChartThemePalette {
        return DEFAULT_PALETTE;
    }

    readonly config: any;

    private static getAxisDefaults(overrideDefaults?: object) {
        return mergeDefaults(overrideDefaults, {
            title: {
                enabled: false,
                text: 'Axis Title',
                spacing: 25,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: FONT_SIZE.MEDIUM,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
            label: {
                fontSize: FONT_SIZE.SMALL,
                fontFamily: DEFAULT_FONT_FAMILY,
                padding: 5,
                color: DEFAULT_LABEL_COLOUR,
                avoidCollisions: true,
            },
            line: {
                enabled: true,
                width: 1,
                stroke: DEFAULT_AXIS_LINE_COLOUR,
            },
            tick: {
                enabled: false,
                width: 1,
                stroke: DEFAULT_AXIS_LINE_COLOUR,
            },
            gridLine: {
                enabled: true,
                style: [{ stroke: DEFAULT_AXIS_GRID_COLOUR, lineDash: [] }],
            },
            crossLines: {
                enabled: false,
                fill: DEFAULT_CROSS_LINES_COLOUR,
                stroke: DEFAULT_CROSS_LINES_COLOUR,
                fillOpacity: 0.1,
                strokeWidth: 1,
                label: {
                    enabled: false,
                    fontSize: FONT_SIZE.SMALL,
                    fontFamily: DEFAULT_FONT_FAMILY,
                    padding: 5,
                    color: DEFAULT_LABEL_COLOUR,
                },
            },
        });
    }

    private static getChartDefaults() {
        return {
            minHeight: 300,
            minWidth: 300,
            background: { visible: true, fill: DEFAULT_BACKGROUND_COLOUR },
            padding: { top: 20, right: 20, bottom: 20, left: 20 },
            keyboard: { enabled: true },
            title: {
                enabled: false,
                text: 'Title',
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: FONT_SIZE.LARGE,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                wrapping: 'hyphenate',
            },
            subtitle: {
                enabled: false,
                text: 'Subtitle',
                spacing: 20,
                fontSize: FONT_SIZE.MEDIUM,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_MUTED_LABEL_COLOUR,
                wrapping: 'hyphenate',
            },
            footnote: {
                enabled: false,
                text: 'Footnote',
                spacing: 20,
                fontSize: FONT_SIZE.MEDIUM,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: 'rgb(140, 140, 140)',
                wrapping: 'hyphenate',
            },
            legend: {
                position: POSITION.BOTTOM,
                spacing: 30,
                listeners: {},
                toggleSeries: true,
                item: {
                    paddingX: 16,
                    paddingY: 8,
                    marker: { size: 15, padding: 8 },
                    label: {
                        color: DEFAULT_LABEL_COLOUR,
                        fontSize: FONT_SIZE.SMALL,
                        fontFamily: DEFAULT_FONT_FAMILY,
                    },
                },
                reverseOrder: false,
                pagination: {
                    marker: { size: 12 },
                    activeStyle: { fill: DEFAULT_LABEL_COLOUR },
                    inactiveStyle: { fill: DEFAULT_MUTED_LABEL_COLOUR },
                    highlightStyle: { fill: DEFAULT_LABEL_COLOUR },
                    label: { color: DEFAULT_LABEL_COLOUR },
                },
            },
            tooltip: {
                enabled: true,
                darkTheme: IS_DARK_THEME,
                range: undefined,
                delay: 0,
            },
            overlays: {
                loading: { darkTheme: IS_DARK_THEME },
                noData: { darkTheme: IS_DARK_THEME },
                noVisibleSeries: { darkTheme: IS_DARK_THEME },
            },
            listeners: {},
        };
    }

    private static readonly cartesianAxisDefault = {
        [CARTESIAN_AXIS_TYPE.NUMBER]: ChartTheme.getAxisDefaults({ line: { enabled: false } }),
        [CARTESIAN_AXIS_TYPE.LOG]: ChartTheme.getAxisDefaults({ base: 10, line: { enabled: false } }),
        [CARTESIAN_AXIS_TYPE.CATEGORY]: ChartTheme.getAxisDefaults({
            groupPaddingInner: 0.1,
            label: { autoRotate: true },
            gridLine: { enabled: false },
        }),
        [CARTESIAN_AXIS_TYPE.TIME]: ChartTheme.getAxisDefaults({ gridLine: { enabled: false } }),
        [CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: ChartTheme.getAxisDefaults({
            groupPaddingInner: 0,
            label: { autoRotate: false },
            gridLine: { enabled: false },
            crosshair: {
                enabled: true,
                snap: true,
                stroke: DEFAULT_MUTED_LABEL_COLOUR,
                strokeWidth: 1,
                strokeOpacity: 1,
                lineDash: [5, 6],
                lineDashOffset: 0,
                label: { enabled: true },
            },
        }),
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: ChartTheme.getAxisDefaults({ gridLine: { enabled: false } }),
        [POLAR_AXIS_TYPE.ANGLE_NUMBER]: ChartTheme.getAxisDefaults({ gridLine: { enabled: false } }),
        [POLAR_AXIS_TYPE.RADIUS_CATEGORY]: ChartTheme.getAxisDefaults({
            line: { enabled: false },
            tick: { enabled: false },
        }),
        [POLAR_AXIS_TYPE.RADIUS_NUMBER]: ChartTheme.getAxisDefaults({
            line: { enabled: false },
            tick: { enabled: false },
        }),
        'grouped-category': ChartTheme.getAxisDefaults(),
    };

    constructor(options: AgChartTheme = {}) {
        const { overrides, palette } = deepClone(options) as AgChartThemeOptions;
        const defaults = this.createChartConfigPerChartType(this.getDefaults());

        if (overrides) {
            this.mergeOverrides(defaults, overrides);
        }

        this.config = Object.freeze(this.templateTheme(defaults));
        this.palette = mergeDefaults(palette, this.getPalette());
    }

    private mergeOverrides(defaults: AgChartThemeOverrides, overrides: AgChartThemeOverrides) {
        for (const { seriesTypes, commonOptions } of Object.values(CHART_TYPE_CONFIG)) {
            const cleanedCommon = { ...overrides.common };
            for (const commonKey of CHART_TYPE_SPECIFIC_COMMON_OPTIONS) {
                if (!commonOptions.includes(commonKey)) {
                    delete cleanedCommon[commonKey];
                }
            }
            if (!cleanedCommon) continue;
            for (const s of seriesTypes) {
                const seriesType = s as keyof AgChartThemeOverrides;
                defaults[seriesType] = mergeDefaults(cleanedCommon, defaults[seriesType]);
            }
        }

        chartTypes.seriesTypes.forEach((s) => {
            const seriesType = s as keyof AgChartThemeOverrides;
            if (overrides[seriesType]) {
                defaults[seriesType] = mergeDefaults(overrides[seriesType], defaults[seriesType]);
            }
        });
    }

    private createChartConfigPerChartType(config: AgChartThemeOverrides) {
        for (const [nextType, { seriesTypes }] of Object.entries(CHART_TYPE_CONFIG)) {
            const typeDefaults = chartDefaults.get(nextType as ChartType) as any;
            for (const seriesType of seriesTypes) {
                config[seriesType as keyof AgChartThemeOverrides] ||= deepClone(typeDefaults);
            }
        }
        return config;
    }

    private getDefaults(): AgChartThemeOverrides {
        const getOverridesByType = (chartType: ChartType, seriesTypes: string[]) => {
            const result: Record<string, { series?: {}; axes?: {} }> = {};
            const chartTypeDefaults = {
                axes: {},
                ...legendRegistry.getThemeTemplates(),
                ...ChartTheme.getChartDefaults(),
                ...chartDefaults.get(chartType),
            };
            for (const seriesType of seriesTypes) {
                result[seriesType] = mergeDefaults(
                    seriesRegistry.getThemeTemplate(seriesType),
                    result[seriesType] ?? deepClone(chartTypeDefaults)
                );

                const { axes } = result[seriesType] as { axes: Record<string, {}> };

                for (const axisType of axisRegistry.keys()) {
                    axes[axisType] = mergeDefaults(
                        axes[axisType],
                        axisRegistry.getThemeTemplate(axisType),
                        (ChartTheme.cartesianAxisDefault as any)[axisType]
                    );
                }
            }

            return result;
        };

        return mergeDefaults(
            getOverridesByType('cartesian', chartTypes.cartesianTypes),
            getOverridesByType('polar', chartTypes.polarTypes),
            getOverridesByType('hierarchy', chartTypes.hierarchyTypes),
            getOverridesByType('topology', chartTypes.topologyTypes),
            getOverridesByType('flow-proportion', chartTypes.flowProportionTypes)
        );
    }

    templateTheme<T>(themeTemplate: T): T {
        const themeInstance = deepClone(themeTemplate);
        const params = this.getTemplateParameters();

        jsonWalk(themeInstance, (node: any) => {
            if (isArray(node)) {
                for (let i = 0; i < node.length; i++) {
                    const symbol = node[i];
                    if (params.has(symbol)) {
                        node[i] = params.get(symbol);
                    }
                }
            } else {
                for (const [name, value] of Object.entries(node)) {
                    if (params.has(value)) {
                        node[name] = params.get(value);
                    }
                }
            }
        });

        return deepClone(themeInstance);
    }

    protected static getDefaultColors(): DefaultColors {
        return {
            fills: DEFAULT_FILLS,
            strokes: DEFAULT_STROKES,
        };
    }

    protected static getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: DEFAULT_FILLS.BLUE,
            stroke: DEFAULT_STROKES.BLUE,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    protected static getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: DEFAULT_FILLS.ORANGE,
            stroke: DEFAULT_STROKES.ORANGE,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    protected static getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: DEFAULT_FILLS.GRAY,
            stroke: DEFAULT_STROKES.GRAY,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    getTemplateParameters() {
        const params = new Map();
        params.set(IS_DARK_THEME, false);
        params.set(DEFAULT_FONT_FAMILY, 'Verdana, sans-serif');
        params.set(DEFAULT_LABEL_COLOUR, 'rgb(70, 70, 70)');
        params.set(DEFAULT_INVERTED_LABEL_COLOUR, 'white');
        params.set(DEFAULT_MUTED_LABEL_COLOUR, 'rgb(140, 140, 140)');
        params.set(DEFAULT_AXIS_GRID_COLOUR, 'rgb(224,234,241)');
        params.set(DEFAULT_AXIS_LINE_COLOUR, 'rgb(195, 195, 195)');
        params.set(DEFAULT_CROSS_LINES_COLOUR, 'rgb(70, 70, 70)');
        params.set(DEFAULT_INSIDE_SERIES_LABEL_COLOUR, DEFAULT_BACKGROUND_FILL);
        params.set(DEFAULT_BACKGROUND_COLOUR, DEFAULT_BACKGROUND_FILL);
        params.set(DEFAULT_SHADOW_COLOUR, 'rgba(0, 0, 0, 0.5)');
        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            DEFAULT_FILLS.ORANGE,
            DEFAULT_FILLS.YELLOW,
            DEFAULT_FILLS.GREEN,
        ]);
        params.set(DEFAULT_HIERARCHY_FILLS, ['#ffffff', '#e0e5ea', '#c1ccd5', '#a3b4c1', '#859cad']);
        params.set(DEFAULT_HIERARCHY_STROKES, ['#ffffff', '#c5cbd1', '#a4b1bd', '#8498a9', '#648096']);
        params.set(DEFAULT_POLAR_SERIES_STROKE, DEFAULT_BACKGROUND_FILL);
        params.set(DEFAULT_COLOURS, ChartTheme.getDefaultColors());
        params.set(DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS, ChartTheme.getWaterfallSeriesDefaultPositiveColors());
        params.set(DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS, ChartTheme.getWaterfallSeriesDefaultNegativeColors());
        params.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, ChartTheme.getWaterfallSeriesDefaultTotalColors());
        params.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            ChartTheme.getWaterfallSeriesDefaultTotalColors().stroke
        );
        params.set(DEFAULT_ANNOTATION_STROKE, DEFAULT_STROKES.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, DEFAULT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_HANDLE_FILL, DEFAULT_BACKGROUND_FILL);

        return params;
    }
}
