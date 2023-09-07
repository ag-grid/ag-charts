import { jsonMerge, jsonWalk } from '../../util/json';
import { deepMerge } from '../../util/object';
import type {
    FontWeight,
    AgChartThemePalette,
    AgChartThemeOptions,
    AgChartThemeOverrides,
    AgBarSeriesLabelOptions,
    AgChartLegendPosition,
    InteractionRange,
    AgTooltipPositionType,
    AgChartTheme,
} from '../agChartOptions';
import { AXIS_TYPES, getAxisThemeTemplate } from '../factory/axisTypes';
import { CHART_TYPES, type ChartType, getChartDefaults } from '../factory/chartTypes';
import { getSeriesThemeTemplate } from '../factory/seriesTypes';

const palette: AgChartThemePalette = {
    fills: ['#f3622d', '#fba71b', '#57b757', '#41a9c9', '#4258c9', '#9a42c8', '#c84164', '#888888'],
    strokes: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
};

export const EXTENDS_AXES_DEFAULTS = Symbol('extends-axes-defaults');
export const EXTENDS_AXES_LABEL_DEFAULTS = Symbol('extends-axes-label-defaults');
export const EXTENDS_AXES_LINE_DEFAULTS = Symbol('extends-axes-line-defaults');
export const EXTENDS_AXES_TICK_DEFAULTS = Symbol('extends-axes-tick-defaults');
export const EXTENDS_SERIES_DEFAULTS = Symbol('extends-series-defaults');
export const OVERRIDE_SERIES_LABEL_DEFAULTS = Symbol('override-series-label-defaults');
export const DEFAULT_FONT_FAMILY = Symbol('default-font');
export const DEFAULT_LABEL_COLOUR = Symbol('default-label-colour');
export const DEFAULT_MUTED_LABEL_COLOUR = Symbol('default-muted-label-colour');
export const DEFAULT_AXIS_GRID_COLOUR = Symbol('default-axis-grid-colour');
export const DEFAULT_BACKGROUND_COLOUR = Symbol('default-background-colour');
export const DEFAULT_SHADOW_COLOUR = Symbol('default-shadow-colour');
export const DEFAULT_TREEMAP_TILE_BORDER_COLOUR = Symbol('default-treemap-tile-border-colour');

const BOLD: FontWeight = 'bold';
const INSIDE: AgBarSeriesLabelOptions['placement'] = 'inside';
const BOTTOM: AgChartLegendPosition = 'bottom';
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
                fontStyle: undefined,
                fontWeight: BOLD,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                color: DEFAULT_LABEL_COLOUR as unknown as string,
            },
            label: {
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                padding: 5,
                rotation: undefined,
                color: DEFAULT_LABEL_COLOUR as unknown as string,
                formatter: undefined,
                avoidCollisions: true,
            },
            line: {
                width: 1,
                color: 'rgb(195, 195, 195)',
            },
            tick: {
                width: 1,
                size: 6,
                color: 'rgb(195, 195, 195)',
            },
            gridStyle: [
                {
                    stroke: DEFAULT_AXIS_GRID_COLOUR as unknown as string,
                    lineDash: [4, 2],
                },
            ],
            crossLines: {
                enabled: false,
                fill: 'rgb(187,221,232)',
                stroke: 'rgb(70,162,192)',
                strokeWidth: 1,
                label: {
                    enabled: false,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    padding: 5,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
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
                    fill: 'yellow',
                    fillOpacity: 1,
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

    private static getBarSeriesDefaults() {
        return {
            ...this.getSeriesDefaults(),
            fillOpacity: 1,
            strokeOpacity: 1,
            normalizedTo: undefined,
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: false,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                color: DEFAULT_LABEL_COLOUR as unknown as string,
                formatter: undefined,
                placement: INSIDE,
            },
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR as unknown as string,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
        };
    }

    private static getLineSeriesDefaults() {
        const seriesDefaults = this.getSeriesDefaults();
        return {
            ...seriesDefaults,
            tooltip: {
                ...seriesDefaults.tooltip,
                format: undefined,
                position: {
                    type: 'node' as AgTooltipPositionType,
                },
            },
        };
    }

    private static getAreaSeriesDefaults() {
        const seriesDefaults = this.getSeriesDefaults();
        return {
            ...seriesDefaults,
            nodeClickRange: 'nearest' as InteractionRange,
            tooltip: {
                ...seriesDefaults.tooltip,
                position: {
                    type: 'node' as AgTooltipPositionType,
                },
            },
        };
    }

    private static getScatterSeriesDefaults() {
        const seriesDefaults = this.getSeriesDefaults();
        return {
            ...seriesDefaults,
            tooltip: {
                ...seriesDefaults.tooltip,
                position: {
                    type: 'node' as AgTooltipPositionType,
                },
            },
        };
    }

    private static getCartesianSeriesMarkerDefaults() {
        return {
            enabled: true,
            shape: 'circle',
            size: 6,
            maxSize: 30,
            strokeWidth: 1,
            formatter: undefined,
        };
    }

    private static getCaptionWrappingDefaults() {
        return 'hyphenate' as const;
    }

    private static getChartDefaults() {
        return {
            background: {
                visible: true,
                fill: DEFAULT_BACKGROUND_COLOUR as unknown as string,
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
                fontWeight: BOLD,
                fontSize: 16,
                fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                color: DEFAULT_LABEL_COLOUR as unknown as string,
                wrapping: ChartTheme.getCaptionWrappingDefaults(),
            },
            subtitle: {
                enabled: false,
                text: 'Subtitle',
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                color: DEFAULT_MUTED_LABEL_COLOUR as unknown as string,
                wrapping: ChartTheme.getCaptionWrappingDefaults(),
            },
            footnote: {
                enabled: false,
                text: 'Footnote',
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                color: 'rgb(140, 140, 140)',
                spacing: 30,
                wrapping: ChartTheme.getCaptionWrappingDefaults(),
            },
            legend: {
                position: BOTTOM,
                spacing: 20,
                listeners: {},
                item: {
                    paddingX: 16,
                    paddingY: 8,
                    marker: {
                        shape: undefined,
                        size: 15,
                        strokeWidth: 1,
                        padding: 8,
                    },
                    label: {
                        color: DEFAULT_LABEL_COLOUR as unknown as string,
                        fontStyle: undefined,
                        fontWeight: undefined,
                        fontSize: 12,
                        fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                        formatter: undefined,
                    },
                },
                reverseOrder: false,
                pagination: {
                    marker: {
                        size: 12,
                    },
                    activeStyle: {
                        fill: DEFAULT_LABEL_COLOUR as unknown as string,
                    },
                    inactiveStyle: {
                        fill: DEFAULT_MUTED_LABEL_COLOUR as unknown as string,
                    },
                    highlightStyle: {
                        fill: DEFAULT_LABEL_COLOUR as unknown as string,
                    },
                    label: {
                        color: DEFAULT_LABEL_COLOUR as unknown as string,
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
        },
        log: {
            ...ChartTheme.getAxisDefaults(),
            base: 10,
        },
        category: {
            ...ChartTheme.getAxisDefaults(),
            groupPaddingInner: 0.1,
            label: {
                ...ChartTheme.getAxisDefaults().label,
                autoRotate: true,
            },
        },
        groupedCategory: {
            ...ChartTheme.getAxisDefaults(),
        },
        time: {
            ...ChartTheme.getAxisDefaults(),
        },
    };

    private static readonly cartesianDefaults: Partial<AgChartThemeOverrides> = {
        bar: {
            ...ChartTheme.getChartDefaults(),
            axes: this.cartesianAxisDefault,
            series: {
                ...ChartTheme.getBarSeriesDefaults(),
            },
        },
        line: {
            ...ChartTheme.getChartDefaults(),
            axes: this.cartesianAxisDefault,
            series: {
                ...ChartTheme.getLineSeriesDefaults(),
                strokeWidth: 2,
                strokeOpacity: 1,
                lineDash: [0],
                lineDashOffset: 0,
                marker: {
                    ...ChartTheme.getCartesianSeriesMarkerDefaults(),
                    fillOpacity: 1,
                    strokeOpacity: 1,
                },
                label: {
                    enabled: false,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
                    formatter: undefined,
                },
            },
        },
        scatter: {
            ...ChartTheme.getChartDefaults(),
            axes: this.cartesianAxisDefault,
            series: {
                ...ChartTheme.getScatterSeriesDefaults(),
                sizeName: 'Size',
                labelName: 'Label',
                marker: {
                    ...ChartTheme.getCartesianSeriesMarkerDefaults(),
                },
                label: {
                    enabled: false,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
                },
            },
        },
        area: {
            ...ChartTheme.getChartDefaults(),
            axes: this.cartesianAxisDefault,
            series: {
                ...ChartTheme.getAreaSeriesDefaults(),
                normalizedTo: undefined,
                fillOpacity: 0.8,
                strokeOpacity: 1,
                strokeWidth: 2,
                lineDash: [0],
                lineDashOffset: 0,
                shadow: {
                    enabled: false,
                    color: DEFAULT_SHADOW_COLOUR as unknown as string,
                    xOffset: 3,
                    yOffset: 3,
                    blur: 5,
                },
                marker: {
                    ...ChartTheme.getCartesianSeriesMarkerDefaults(),
                    fillOpacity: 1,
                    strokeOpacity: 1,
                    enabled: false,
                },
                label: {
                    enabled: false,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
                    formatter: undefined,
                },
            },
        },
        histogram: {
            ...ChartTheme.getChartDefaults(),
            axes: this.cartesianAxisDefault,
            series: {
                ...ChartTheme.getSeriesDefaults(),
                strokeWidth: 1,
                fillOpacity: 1,
                strokeOpacity: 1,
                lineDash: [0],
                lineDashOffset: 0,
                areaPlot: false,
                bins: undefined,
                aggregation: 'sum' as const,
                label: {
                    enabled: false,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
                    formatter: undefined,
                },
                shadow: {
                    enabled: true,
                    color: DEFAULT_SHADOW_COLOUR as unknown as string,
                    xOffset: 0,
                    yOffset: 0,
                    blur: 5,
                },
            },
        },
    };

    private static readonly polarDefaults: Partial<AgChartThemeOverrides> = {
        pie: {
            ...ChartTheme.getChartDefaults(),
            series: {
                ...ChartTheme.getSeriesDefaults(),
                title: {
                    enabled: true,
                    fontStyle: undefined,
                    fontWeight: BOLD,
                    fontSize: 14,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
                    spacing: 0,
                },
                radiusKey: undefined,
                radiusName: undefined,
                calloutLabelKey: undefined,
                calloutLabelName: undefined,
                sectorLabelKey: undefined,
                sectorLabelName: undefined,
                calloutLabel: {
                    enabled: true,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
                    offset: 3,
                    minAngle: 0,
                },
                sectorLabel: {
                    enabled: true,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
                    positionOffset: 0,
                    positionRatio: 0.5,
                },
                calloutLine: {
                    length: 10,
                    strokeWidth: 2,
                },
                fillOpacity: 1,
                strokeOpacity: 1,
                strokeWidth: 1,
                lineDash: [0],
                lineDashOffset: 0,
                rotation: 0,
                outerRadiusOffset: 0,
                innerRadiusOffset: 0,
                shadow: {
                    enabled: false,
                    color: DEFAULT_SHADOW_COLOUR as unknown as string,
                    xOffset: 3,
                    yOffset: 3,
                    blur: 5,
                },
                innerLabels: {
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
                    margin: 2,
                },
            },
        },
    };

    private static readonly hierarchyDefaults: Partial<AgChartThemeOverrides> = {
        treemap: {
            ...ChartTheme.getChartDefaults(),
            series: {
                ...ChartTheme.getSeriesDefaults(),
                showInLegend: false,
                labelKey: 'label',
                sizeKey: 'size',
                colorKey: 'color',
                colorDomain: [-5, 5],
                colorRange: ['#cb4b3f', '#6acb64'],
                groupFill: '#272931',
                groupStroke: DEFAULT_TREEMAP_TILE_BORDER_COLOUR as unknown as string,
                groupStrokeWidth: 1,
                tileStroke: DEFAULT_TREEMAP_TILE_BORDER_COLOUR as unknown as string,
                tileStrokeWidth: 1,
                gradient: true,
                tileShadow: {
                    enabled: false,
                    color: DEFAULT_SHADOW_COLOUR as unknown as string,
                    xOffset: 3,
                    yOffset: 3,
                    blur: 5,
                },
                labelShadow: {
                    enabled: true,
                    color: 'rgba(0, 0, 0, 0.4)',
                    xOffset: 1.5,
                    yOffset: 1.5,
                    blur: 5,
                },
                highlightGroups: true,
                nodePadding: 2,
                nodeGap: 0,
                title: {
                    enabled: true,
                    color: DEFAULT_LABEL_COLOUR as unknown as string,
                    fontStyle: undefined,
                    fontWeight: BOLD,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    padding: 2,
                },
                subtitle: {
                    enabled: true,
                    color: DEFAULT_MUTED_LABEL_COLOUR as unknown as string,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 9,
                    fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                    padding: 2,
                },
                labels: {
                    large: {
                        enabled: true,
                        fontStyle: undefined,
                        fontWeight: BOLD,
                        fontSize: 18,
                        fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                        color: DEFAULT_LABEL_COLOUR as unknown as string,
                        wrapping: 'on-space',
                    },
                    medium: {
                        enabled: true,
                        fontStyle: undefined,
                        fontWeight: BOLD,
                        fontSize: 14,
                        fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                        color: DEFAULT_LABEL_COLOUR as unknown as string,
                        wrapping: 'on-space',
                    },
                    small: {
                        enabled: true,
                        fontStyle: undefined,
                        fontWeight: BOLD,
                        fontSize: 10,
                        fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                        color: DEFAULT_LABEL_COLOUR as unknown as string,
                        wrapping: 'on-space',
                    },
                    value: {
                        style: {
                            enabled: true,
                            fontStyle: undefined,
                            fontWeight: undefined,
                            fontSize: 12,
                            fontFamily: DEFAULT_FONT_FAMILY as unknown as string,
                            color: DEFAULT_LABEL_COLOUR as unknown as string,
                        },
                    },
                },
            },
        },
    };

    private static readonly defaults: AgChartThemeOverrides = {
        ...ChartTheme.cartesianDefaults,
        ...ChartTheme.polarDefaults,
        ...ChartTheme.hierarchyDefaults,
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
            applyOverrides(CHART_TYPES.seriesTypes, common);

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
        const typeToAliases = {
            cartesian: CHART_TYPES.cartesianTypes,
            polar: CHART_TYPES.polarTypes,
            hierarchy: CHART_TYPES.hierarchyTypes,
            groupedCategory: [],
        };
        Object.entries(typeToAliases).forEach(([nextType, aliases]) => {
            const type = nextType as ChartType;
            const typeDefaults = getChartDefaults(type) as any;

            aliases.forEach((next) => {
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
        let defaults = deepMerge({}, ChartTheme.defaults);

        const getChartTypeDefaults = (chartType: ChartType) => {
            return {
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

    private templateTheme(themeTemplate: {}): {} {
        const themeInstance = jsonMerge([themeTemplate]);
        const { extensions, properties } = this.getTemplateParameters();

        jsonWalk(
            themeInstance,
            (_, node) => {
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
                for (const [name, value] of Object.entries(node)) {
                    if (properties.has(value)) {
                        node[name] = properties.get(value);
                    }
                }
            },
            {}
        );

        return themeInstance;
    }

    protected getTemplateParameters() {
        const extensions = new Map();
        extensions.set(EXTENDS_AXES_DEFAULTS, ChartTheme.getAxisDefaults());
        extensions.set(EXTENDS_AXES_LABEL_DEFAULTS, ChartTheme.getAxisDefaults().label);
        extensions.set(EXTENDS_AXES_LINE_DEFAULTS, ChartTheme.getAxisDefaults().line);
        extensions.set(EXTENDS_AXES_TICK_DEFAULTS, ChartTheme.getAxisDefaults().tick);
        extensions.set(EXTENDS_SERIES_DEFAULTS, ChartTheme.getSeriesDefaults());
        extensions.set(OVERRIDE_SERIES_LABEL_DEFAULTS, {});

        const properties = new Map();
        properties.set(DEFAULT_FONT_FAMILY as unknown as string, 'Verdana, sans-serif');
        properties.set(DEFAULT_LABEL_COLOUR, 'rgb(70, 70, 70)');
        properties.set(DEFAULT_MUTED_LABEL_COLOUR, 'rgb(140, 140, 140)');
        properties.set(DEFAULT_AXIS_GRID_COLOUR, 'rgb(219, 219, 219)');
        properties.set(DEFAULT_BACKGROUND_COLOUR, 'white');
        properties.set(DEFAULT_SHADOW_COLOUR, 'rgba(0, 0, 0, 0.5)');
        properties.set(DEFAULT_TREEMAP_TILE_BORDER_COLOUR, 'black');

        return {
            extensions,
            properties,
        };
    }
}
