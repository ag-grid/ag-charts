import type {
    AgChartTheme,
    AgChartThemeOptions,
    AgChartThemeOverrides,
    AgChartThemePalette,
    AgCommonThemeableChartOptions,
    InteractionRange,
} from '../../options/agChartOptions';
import { deepClone, jsonWalk } from '../../util/json';
import { mergeDefaults } from '../../util/object';
import { isArray, isObject } from '../../util/type-guards';
import { AXIS_TYPES, getAxisThemeTemplate } from '../factory/axisTypes';
import { CHART_TYPES, type ChartType, getChartDefaults } from '../factory/chartTypes';
import { getLegendThemeTemplates } from '../factory/legendTypes';
import { getSeriesThemeTemplate } from '../factory/seriesTypes';
import { FONT_SIZE, FONT_WEIGHT, POSITION } from './constants';
import { DEFAULT_FILLS, DEFAULT_STROKES } from './defaultColors';
import {
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_AXIS_LINE_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
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
    EXTENDS_AXES_DEFAULTS,
    EXTENDS_AXES_GRID_LINE_DEFAULTS,
    EXTENDS_AXES_LABEL_DEFAULTS,
    EXTENDS_AXES_LINE_DEFAULTS,
    EXTENDS_AXES_TICK_DEFAULTS,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    EXTENDS_CHART_DEFAULTS,
    EXTENDS_LEGEND_DEFAULTS,
    EXTENDS_LEGEND_ITEM_DEFAULTS,
    EXTENDS_LEGEND_ITEM_MARKER_DEFAULTS,
    EXTENDS_SERIES_DEFAULTS,
    IS_DARK_MODE,
    OVERRIDE_SERIES_LABEL_DEFAULTS,
} from './symbols';

// If this changes, update plugins/ag-charts-generate-chart-thumbnail/src/executors/generate/generator/constants.ts
const DEFAULT_BACKGROUND_FILL = 'white';

const palette: AgChartThemePalette = {
    fills: Object.values(DEFAULT_FILLS),
    strokes: Object.values(DEFAULT_STROKES),
};

type ChartTypeConfig = {
    seriesTypes: string[];
    commonOptions: (keyof AgCommonThemeableChartOptions)[];
};
const CHART_TYPE_CONFIG: { [k in ChartType]: ChartTypeConfig } = {
    get cartesian(): ChartTypeConfig {
        return { seriesTypes: CHART_TYPES.cartesianTypes, commonOptions: ['zoom', 'navigator'] };
    },
    get polar(): ChartTypeConfig {
        return { seriesTypes: CHART_TYPES.polarTypes, commonOptions: [] };
    },
    get hierarchy(): ChartTypeConfig {
        return { seriesTypes: CHART_TYPES.hierarchyTypes, commonOptions: [] };
    },
};
const CHART_TYPE_SPECIFIC_COMMON_OPTIONS = Object.values(CHART_TYPE_CONFIG).reduce<
    (keyof AgCommonThemeableChartOptions)[]
>((r, { commonOptions }) => [...r, ...commonOptions], []);

export function resolvePartialPalette(
    partialPalette: Partial<AgChartThemePalette> | null | undefined,
    basePalette: AgChartThemePalette
): AgChartThemePalette | null {
    if (partialPalette == null) return null;
    return {
        fills: partialPalette.fills ?? basePalette.fills,
        strokes: partialPalette.strokes ?? basePalette.strokes,
    };
}

export class ChartTheme {
    readonly palette: AgChartThemePalette;

    protected getPalette(): AgChartThemePalette {
        return palette;
    }

    readonly config: any;

    private static getAxisDefaults() {
        return {
            top: {},
            right: {},
            bottom: {},
            left: {},
            title: {
                enabled: false,
                text: 'Axis Title',
                spacing: 25,
                fontStyle: undefined,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: FONT_SIZE.MEDIUM,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
            label: {
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: FONT_SIZE.SMALL,
                fontFamily: DEFAULT_FONT_FAMILY,
                padding: 5,
                rotation: undefined,
                color: DEFAULT_LABEL_COLOUR,
                formatter: undefined,
                avoidCollisions: true,
            },
            line: {
                enabled: true,
                width: 1,
                color: DEFAULT_AXIS_LINE_COLOUR,
            },
            tick: {
                enabled: false,
                width: 1,
                color: DEFAULT_AXIS_LINE_COLOUR,
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        stroke: DEFAULT_AXIS_GRID_COLOUR,
                        lineDash: [],
                    },
                ],
            },
            crossLines: {
                enabled: false,
                fill: DEFAULT_CROSS_LINES_COLOUR,
                stroke: DEFAULT_CROSS_LINES_COLOUR,
                fillOpacity: 0.1,
                strokeWidth: 1,
                label: {
                    enabled: false,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: FONT_SIZE.SMALL,
                    fontFamily: DEFAULT_FONT_FAMILY,
                    padding: 5,
                    color: DEFAULT_LABEL_COLOUR,
                },
            },
        };
    }

    private static getSeriesDefaults() {
        return {
            tooltip: {
                enabled: true,
                renderer: undefined,
            },
            visible: true,
            showInLegend: true,
            highlightStyle: {
                item: {
                    fill: 'rgba(255,255,255, 0.33)',
                    stroke: `rgba(0, 0, 0, 0.4)`,
                    strokeWidth: 2,
                },
                series: {
                    dimOpacity: 1,
                },
                text: {
                    color: 'black',
                },
            },
            nodeClickRange: 'exact' as InteractionRange,
        };
    }

    private static getCartesianSeriesMarkerDefaults() {
        return {
            enabled: true,
            shape: 'circle',
            size: 7,
            strokeWidth: 1,
            formatter: undefined,
        };
    }

    private static getLegendItemMarkerDefaults() {
        return {
            shape: undefined,
            size: 15,
            padding: 8,
        };
    }

    private static getCaptionWrappingDefaults() {
        return 'hyphenate' as const;
    }

    private static getChartDefaults() {
        return {
            background: {
                visible: true,
                fill: DEFAULT_BACKGROUND_COLOUR,
            },
            padding: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
            },
            title: {
                enabled: false,
                text: 'Title',
                fontStyle: undefined,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: FONT_SIZE.LARGE,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                wrapping: ChartTheme.getCaptionWrappingDefaults(),
            },
            subtitle: {
                enabled: false,
                text: 'Subtitle',
                spacing: 20,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: FONT_SIZE.MEDIUM,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_MUTED_LABEL_COLOUR,
                wrapping: ChartTheme.getCaptionWrappingDefaults(),
            },
            footnote: {
                enabled: false,
                text: 'Footnote',
                spacing: 20,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: FONT_SIZE.MEDIUM,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: 'rgb(140, 140, 140)',
                wrapping: ChartTheme.getCaptionWrappingDefaults(),
            },
            legend: {
                position: POSITION.BOTTOM,
                spacing: 30,
                listeners: {},
                item: {
                    paddingX: 16,
                    paddingY: 8,
                    marker: ChartTheme.getLegendItemMarkerDefaults(),
                    label: {
                        color: DEFAULT_LABEL_COLOUR,
                        fontStyle: undefined,
                        fontWeight: undefined,
                        fontSize: FONT_SIZE.SMALL,
                        fontFamily: DEFAULT_FONT_FAMILY,
                        formatter: undefined,
                    },
                },
                reverseOrder: false,
                pagination: {
                    marker: {
                        size: 12,
                    },
                    activeStyle: {
                        fill: DEFAULT_LABEL_COLOUR,
                    },
                    inactiveStyle: {
                        fill: DEFAULT_MUTED_LABEL_COLOUR,
                    },
                    highlightStyle: {
                        fill: DEFAULT_LABEL_COLOUR,
                    },
                    label: {
                        color: DEFAULT_LABEL_COLOUR,
                    },
                },
            },
            tooltip: {
                enabled: true,
                darkMode: IS_DARK_MODE,
                range: 'nearest' as InteractionRange,
                delay: 0,
            },
            overlays: {
                noData: {
                    darkMode: IS_DARK_MODE,
                },
                noVisibleSeries: {
                    darkMode: IS_DARK_MODE,
                },
            },
            listeners: {},
        };
    }

    private static readonly cartesianAxisDefault = {
        number: {
            ...ChartTheme.getAxisDefaults(),
            line: {
                ...ChartTheme.getAxisDefaults().line,
                enabled: false,
            },
        },
        log: {
            ...ChartTheme.getAxisDefaults(),
            base: 10,
            line: {
                ...ChartTheme.getAxisDefaults().line,
                enabled: false,
            },
        },
        category: {
            ...ChartTheme.getAxisDefaults(),
            groupPaddingInner: 0.1,
            label: {
                ...ChartTheme.getAxisDefaults().label,
                autoRotate: true,
            },
            gridLine: {
                ...ChartTheme.getAxisDefaults().gridLine,
                enabled: false,
            },
        },
        'grouped-category': {
            ...ChartTheme.getAxisDefaults(),
        },
        time: {
            ...ChartTheme.getAxisDefaults(),
            gridLine: {
                ...ChartTheme.getAxisDefaults().gridLine,
                enabled: false,
            },
        },
    };

    constructor(options?: AgChartTheme) {
        options = deepClone(options ?? {}) as AgChartThemeOptions;
        const { overrides = null, palette = null } = options;

        const defaults = this.createChartConfigPerChartType(this.getDefaults());

        if (overrides) {
            const { common } = overrides;

            const applyOverrides = (
                seriesTypes: string[],
                overrideOpts: AgChartThemeOverrides[keyof AgChartThemeOverrides]
            ) => {
                if (!overrideOpts) return;
                for (const s of seriesTypes) {
                    const seriesType = s as keyof AgChartThemeOverrides;
                    defaults[seriesType] = mergeDefaults(overrideOpts, defaults[seriesType]);
                }
            };
            for (const [, { seriesTypes, commonOptions }] of Object.entries(CHART_TYPE_CONFIG)) {
                const cleanedCommon = { ...common };
                for (const commonKey of CHART_TYPE_SPECIFIC_COMMON_OPTIONS) {
                    if (!commonOptions.includes(commonKey)) {
                        delete cleanedCommon[commonKey];
                    }
                }
                applyOverrides(seriesTypes, cleanedCommon);
            }

            CHART_TYPES.seriesTypes.forEach((s) => {
                const seriesType = s as keyof AgChartThemeOverrides;
                if (overrides[seriesType]) {
                    defaults[seriesType] = mergeDefaults(overrides[seriesType], defaults[seriesType]);
                }
            });
        }

        const basePalette = this.getPalette();
        this.palette = resolvePartialPalette(palette, basePalette) ?? basePalette;

        this.config = Object.freeze(this.templateTheme(defaults));
    }

    private createChartConfigPerChartType(config: AgChartThemeOverrides) {
        Object.entries(CHART_TYPE_CONFIG).forEach(([nextType, { seriesTypes }]) => {
            const typeDefaults = getChartDefaults(nextType as ChartType) as any;

            seriesTypes.forEach((seriesType) => {
                const alias = seriesType as keyof AgChartThemeOverrides;
                config[alias] ||= deepClone(typeDefaults);
            });
        });

        return config;
    }

    private getDefaults(): AgChartThemeOverrides {
        const getChartTypeDefaults = (chartType: ChartType) => {
            return {
                ...getLegendThemeTemplates(),
                ...ChartTheme.getChartDefaults(),
                ...getChartDefaults(chartType),
            };
        };

        const getOverridesByType = (chartType: ChartType, seriesTypes: string[]) => {
            const chartDefaults = getChartTypeDefaults(chartType) as any;
            const result: Record<string, { series?: {}; axes?: {} }> = {};
            for (const seriesType of seriesTypes) {
                result[seriesType] ??= deepClone(chartDefaults);
                const axes: Record<string, {}> = (result[seriesType].axes ??= {});

                result[seriesType].series = mergeDefaults(
                    getSeriesThemeTemplate(seriesType),
                    result[seriesType].series
                );

                for (const axisType of AXIS_TYPES.axesTypes) {
                    axes[axisType] = mergeDefaults(
                        getAxisThemeTemplate(axisType),
                        chartType === 'cartesian' && (ChartTheme.cartesianAxisDefault as any)[axisType],
                        axes[axisType]
                    );
                }
            }

            return result;
        };

        return mergeDefaults(
            getOverridesByType('cartesian', CHART_TYPES.cartesianTypes),
            getOverridesByType('polar', CHART_TYPES.polarTypes),
            getOverridesByType('hierarchy', CHART_TYPES.hierarchyTypes)
        );
    }

    templateTheme<T>(themeTemplate: T): T {
        const themeInstance = deepClone(themeTemplate);
        const { extensions, properties } = this.getTemplateParameters();

        jsonWalk(themeInstance, (node: any) => {
            if (node['__extends__']) {
                const key = node['__extends__'];
                const source = extensions.get(key);
                if (source == null) {
                    throw new Error(`AG Charts - no template variable provided for: ${key}`);
                }
                Object.keys(source).forEach((key) => {
                    if (!(key in node)) {
                        node[key] = source[key];
                    } else if (isObject(node[key])) {
                        node[key] = mergeDefaults(node[key], source[key]);
                    }
                });
                delete node['__extends__'];
            }
            if (node['__overrides__']) {
                const key = node['__overrides__'];
                const source = extensions.get(key);
                if (source == null) {
                    throw new Error(`AG Charts - no template variable provided for: ${key}`);
                }
                Object.assign(node, source);
                delete node['__overrides__'];
            }

            if (isArray(node)) {
                for (let i = 0; i < node.length; i++) {
                    const symbol = node[i];
                    if (properties.has(symbol)) {
                        node[i] = properties.get(symbol);
                    }
                }
            } else {
                for (const [name, value] of Object.entries(node)) {
                    if (properties.has(value)) {
                        node[name] = properties.get(value);
                    }
                }
            }
        });

        return deepClone(themeInstance);
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
        const extensions = new Map();
        extensions.set(EXTENDS_CHART_DEFAULTS, ChartTheme.getChartDefaults());
        extensions.set(EXTENDS_AXES_DEFAULTS, ChartTheme.getAxisDefaults());
        extensions.set(EXTENDS_LEGEND_DEFAULTS, ChartTheme.getChartDefaults().legend);
        extensions.set(EXTENDS_LEGEND_ITEM_DEFAULTS, ChartTheme.getChartDefaults().legend.item);
        extensions.set(EXTENDS_LEGEND_ITEM_MARKER_DEFAULTS, ChartTheme.getLegendItemMarkerDefaults());
        extensions.set(EXTENDS_AXES_LABEL_DEFAULTS, ChartTheme.getAxisDefaults().label);
        extensions.set(EXTENDS_AXES_LINE_DEFAULTS, ChartTheme.getAxisDefaults().line);
        extensions.set(EXTENDS_AXES_TICK_DEFAULTS, ChartTheme.getAxisDefaults().tick);
        extensions.set(EXTENDS_AXES_GRID_LINE_DEFAULTS, ChartTheme.getAxisDefaults().gridLine);
        extensions.set(EXTENDS_SERIES_DEFAULTS, ChartTheme.getSeriesDefaults());
        extensions.set(OVERRIDE_SERIES_LABEL_DEFAULTS, {});
        extensions.set(EXTENDS_CARTESIAN_MARKER_DEFAULTS, ChartTheme.getCartesianSeriesMarkerDefaults());

        const properties = new Map();
        properties.set(IS_DARK_MODE, false);
        properties.set(DEFAULT_FONT_FAMILY, 'Verdana, sans-serif');
        properties.set(DEFAULT_LABEL_COLOUR, 'rgb(70, 70, 70)');
        properties.set(DEFAULT_INVERTED_LABEL_COLOUR, 'white');
        properties.set(DEFAULT_MUTED_LABEL_COLOUR, 'rgb(140, 140, 140)');
        properties.set(DEFAULT_AXIS_GRID_COLOUR, 'rgb(224,234,241)');
        properties.set(DEFAULT_AXIS_LINE_COLOUR, 'rgb(195, 195, 195)');
        properties.set(DEFAULT_CROSS_LINES_COLOUR, 'rgb(70, 70, 70)');
        properties.set(DEFAULT_INSIDE_SERIES_LABEL_COLOUR, DEFAULT_BACKGROUND_FILL);
        properties.set(DEFAULT_BACKGROUND_COLOUR, DEFAULT_BACKGROUND_FILL);
        properties.set(DEFAULT_SHADOW_COLOUR, 'rgba(0, 0, 0, 0.5)');
        properties.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            DEFAULT_FILLS.ORANGE,
            DEFAULT_FILLS.YELLOW,
            DEFAULT_FILLS.GREEN,
        ]);
        properties.set(DEFAULT_HIERARCHY_FILLS, ['#ffffff', '#e0e5ea', '#c1ccd5', '#a3b4c1', '#859cad']);
        properties.set(DEFAULT_HIERARCHY_STROKES, ['#ffffff', '#c5cbd1', '#a4b1bd', '#8498a9', '#648096']);
        properties.set(DEFAULT_POLAR_SERIES_STROKE, DEFAULT_BACKGROUND_FILL);
        properties.set(DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS, ChartTheme.getWaterfallSeriesDefaultPositiveColors());
        properties.set(DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS, ChartTheme.getWaterfallSeriesDefaultNegativeColors());
        properties.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, ChartTheme.getWaterfallSeriesDefaultTotalColors());
        properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            ChartTheme.getWaterfallSeriesDefaultTotalColors().stroke
        );

        return {
            extensions,
            properties,
        };
    }
}
