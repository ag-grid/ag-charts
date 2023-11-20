import type {
    AgChartTheme,
    AgChartThemeOptions,
    AgChartThemeOverrides,
    AgChartThemePalette,
    AgCommonThemeableChartOptions,
    InteractionRange,
} from '../../options/agChartOptions';
import { jsonMerge, jsonWalk } from '../../util/json';
import { deepMerge } from '../../util/object';
import { AXIS_TYPES, getAxisThemeTemplate } from '../factory/axisTypes';
import { CHART_TYPES, type ChartType, getChartDefaults } from '../factory/chartTypes';
import { getLegendThemeTemplates } from '../factory/legendTypes';
import { getSeriesThemeTemplate } from '../factory/seriesTypes';
import { BOTTOM, FONT_SIZE, NORMAL } from './constants';
import { DEFAULT_FILLS, DEFAULT_STROKES } from './defaultColors';
import {
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_AXIS_LINE_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
    DEFAULT_CROSS_LINES_COLOUR,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_FONT_FAMILY,
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
    OVERRIDE_SERIES_LABEL_DEFAULTS,
} from './symbols';

const DEFAULT_BACKGROUND_FILL = 'white';

const palette: AgChartThemePalette = {
    fills: Array.from(Object.values(DEFAULT_FILLS)),
    strokes: Array.from(Object.values(DEFAULT_STROKES)),
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
                fontWeight: NORMAL,
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
                    fill: 'white',
                    fillOpacity: 0.33,
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
                fontWeight: NORMAL,
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
                position: BOTTOM,
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
                range: 'nearest' as InteractionRange,
                delay: 0,
            },
            listeners: {},
        };
    }

    private static readonly cartesianAxisDefault = {
        number: {
            ...ChartTheme.getAxisDefaults(),
            line: {
                ...ChartTheme.getAxisDefaults().line,
                // enabled: false, TODO: fix breaking tests when this is set, use width: 0 for now
                width: 0,
            },
        },
        log: {
            ...ChartTheme.getAxisDefaults(),
            base: 10,
            line: {
                ...ChartTheme.getAxisDefaults().line,
                // enabled: false, TODO: fix breaking tests when this is set, use width: 0 for now
                width: 0,
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
        options = deepMerge({}, options ?? {}) as AgChartThemeOptions;
        const { overrides = null, palette = null } = options;

        const defaults = this.createChartConfigPerChartType(this.getDefaults());

        if (overrides) {
            const { common } = overrides;

            const applyOverrides = <K extends keyof typeof defaults>(
                seriesTypes: string[],
                overrideOpts: AgChartThemeOverrides[K]
            ) => {
                if (!overrideOpts) return;
                for (const s of seriesTypes) {
                    const seriesType = s as keyof AgChartThemeOverrides;
                    defaults[seriesType] = deepMerge(defaults[seriesType], overrideOpts);
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
                    defaults[seriesType] = deepMerge(defaults[seriesType], overrides[seriesType]);
                }
            });
        }
        this.palette = palette ?? this.getPalette();

        this.config = Object.freeze(this.templateTheme(defaults));
    }

    private createChartConfigPerChartType(config: AgChartThemeOverrides) {
        Object.entries(CHART_TYPE_CONFIG).forEach(([nextType, { seriesTypes }]) => {
            const typeDefaults = getChartDefaults(nextType as ChartType) as any;

            seriesTypes.forEach((next) => {
                const alias = next as keyof AgChartThemeOverrides;
                if (!config[alias]) {
                    config[alias] = {};
                    deepMerge(config[alias], typeDefaults);
                }
            });
        });

        return config;
    }

    private getDefaults(): AgChartThemeOverrides {
        let defaults = {};

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
                result[seriesType] ??= deepMerge({}, chartDefaults);
                const axes: Record<string, {}> = (result[seriesType].axes ??= {});

                const template = getSeriesThemeTemplate(seriesType);
                if (template) {
                    result[seriesType].series = deepMerge(result[seriesType].series, template);
                }

                for (const axisType of AXIS_TYPES.axesTypes) {
                    const template = getAxisThemeTemplate(axisType);
                    if (chartType === 'cartesian') {
                        axes[axisType] = deepMerge(
                            axes[axisType],
                            (ChartTheme.cartesianAxisDefault as any)[axisType] ?? {}
                        );
                    }
                    if (template) {
                        axes[axisType] = deepMerge(axes[axisType], template);
                    }
                }
            }

            return result;
        };

        defaults = deepMerge(defaults, getOverridesByType('cartesian', CHART_TYPES.cartesianTypes));
        defaults = deepMerge(defaults, getOverridesByType('polar', CHART_TYPES.polarTypes));
        defaults = deepMerge(defaults, getOverridesByType('hierarchy', CHART_TYPES.hierarchyTypes));

        return defaults;
    }

    templateTheme<T>(themeTemplate: T): T {
        const themeInstance = jsonMerge([themeTemplate]);
        const { extensions, properties } = this.getTemplateParameters();

        jsonWalk(themeInstance, (_, node) => {
            if (node['__extends__']) {
                const key = node['__extends__'];
                const source = extensions.get(key);
                if (source == null) {
                    throw new Error('AG Charts - no template variable provided for: ' + key);
                }
                Object.keys(source).forEach((key) => {
                    if (!(key in node)) {
                        node[key] = source[key];
                    }
                });
                delete node['__extends__'];
            }
            if (node['__overrides__']) {
                const key = node['__overrides__'];
                const source = extensions.get(key);
                if (source == null) {
                    throw new Error('AG Charts - no template variable provided for: ' + key);
                }
                Object.assign(node, source);
                delete node['__overrides__'];
            }

            if (Array.isArray(node)) {
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

        return themeInstance;
    }

    protected static getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: DEFAULT_FILLS.BLUE,
            stroke: DEFAULT_STROKES.BLUE,
        };
    }

    protected static getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: DEFAULT_FILLS.ORANGE,
            stroke: DEFAULT_STROKES.ORANGE,
        };
    }

    protected static getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: DEFAULT_FILLS.GRAY,
            stroke: DEFAULT_STROKES.GRAY,
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
        properties.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, ['rgb(247,144,110)', 'rgb(140,236,121)']);
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
