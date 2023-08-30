import { jsonMerge, jsonWalk } from '../../util/json';
import { deepMerge } from '../../util/object';
import type {
    FontWeight,
    AgPolarSeriesTheme,
    AgChartThemePalette,
    AgChartThemeOptions,
    AgChartThemeOverrides,
    AgCartesianThemeOptions,
    AgBarSeriesLabelOptions,
    AgChartLegendPosition,
    AgPolarThemeOptions,
    AgHierarchyThemeOptions,
    AgCartesianSeriesTheme,
    AgHierarchySeriesTheme,
    InteractionRange,
    AgTooltipPositionType,
} from '../agChartOptions';
import { AXIS_TYPES, getAxisThemeTemplate } from '../factory/axisTypes';
import type { ChartType } from '../factory/chartTypes';
import { CHART_TYPES, getChartDefaults } from '../factory/chartTypes';
import { getSeriesThemeTemplate } from '../factory/seriesTypes';

const palette: AgChartThemePalette = {
    fills: ['#f3622d', '#fba71b', '#57b757', '#41a9c9', '#4258c9', '#9a42c8', '#c84164', '#888888'],
    strokes: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
};

type ChartThemeDefaults = {
    cartesian: AgCartesianThemeOptions;
    groupedCategory: AgCartesianThemeOptions;
    polar: AgPolarThemeOptions;
    hierarchy: AgHierarchyThemeOptions;
} & { [key in keyof AgCartesianSeriesTheme]?: AgCartesianThemeOptions } & {
    [key in keyof AgPolarSeriesTheme]?: AgPolarThemeOptions;
} & { [key in keyof AgHierarchySeriesTheme]?: AgHierarchyThemeOptions };

export const EXTENDS_AXES_DEFAULTS = Symbol('extends-axes-defaults');
export const EXTENDS_AXES_LABEL_DEFAULTS = Symbol('extends-axes-label-defaults');
export const EXTENDS_AXES_LINE_DEFAULTS = Symbol('extends-axes-line-defaults');
export const EXTENDS_SERIES_DEFAULTS = Symbol('extends-series-defaults');
export const OVERRIDE_SERIES_LABEL_DEFAULTS = Symbol('override-series-label-defaults');
export const DEFAULT_FONT_FAMILY = Symbol('default-font');

const BOLD: FontWeight = 'bold';
const INSIDE: AgBarSeriesLabelOptions['placement'] = 'inside';
const BOTTOM: AgChartLegendPosition = 'bottom';
export class ChartTheme {
    readonly palette: AgChartThemePalette;

    protected getPalette(): AgChartThemePalette {
        return palette;
    }

    readonly config: any;

    static fontFamily = 'Verdana, sans-serif';
    static shadowColour = 'rgba(0, 0, 0, 0.5)';
    static labelColour = 'rgb(70, 70, 70)';

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
                fontFamily: this.fontFamily,
                color: ChartTheme.labelColour,
            },
            label: {
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: this.fontFamily,
                padding: 5,
                rotation: undefined,
                color: 'rgb(87, 87, 87)',
                formatter: undefined,
                autoRotate: false,
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
                    stroke: 'rgb(219, 219, 219)',
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
                    fontFamily: this.fontFamily,
                    padding: 5,
                    color: 'rgb(87, 87, 87)',
                },
            },
        };
    }

    static getSeriesDefaults() {
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
                fontFamily: this.fontFamily,
                color: ChartTheme.labelColour,
                formatter: undefined,
                placement: INSIDE,
            },
            shadow: {
                enabled: false,
                color: ChartTheme.shadowColour,
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
                fill: 'white',
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
                fontFamily: this.fontFamily,
                color: ChartTheme.labelColour,
                wrapping: ChartTheme.getCaptionWrappingDefaults(),
            },
            subtitle: {
                enabled: false,
                text: 'Subtitle',
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: this.fontFamily,
                color: 'rgb(140, 140, 140)',
                wrapping: ChartTheme.getCaptionWrappingDefaults(),
            },
            footnote: {
                enabled: false,
                text: 'Footnote',
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: this.fontFamily,
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
                        color: 'black',
                        fontStyle: undefined,
                        fontWeight: undefined,
                        fontSize: 12,
                        fontFamily: this.fontFamily,
                        formatter: undefined,
                    },
                },
                reverseOrder: false,
                pagination: {
                    marker: {
                        size: 12,
                    },
                    activeStyle: {
                        fill: ChartTheme.labelColour,
                    },
                    inactiveStyle: {
                        fill: 'rgb(219, 219, 219)',
                    },
                    highlightStyle: {
                        fill: ChartTheme.labelColour,
                    },
                    label: {
                        color: ChartTheme.labelColour,
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

    private static readonly cartesianDefaults: AgCartesianThemeOptions = {
        ...ChartTheme.getChartDefaults(),
        axes: {
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
        },
        series: {
            bar: {
                ...ChartTheme.getBarSeriesDefaults(),
            },
            line: {
                ...ChartTheme.getLineSeriesDefaults(),
                title: undefined,
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
                    fontFamily: ChartTheme.fontFamily,
                    color: ChartTheme.labelColour,
                    formatter: undefined,
                },
            },
            scatter: {
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
                    fontFamily: ChartTheme.fontFamily,
                    color: ChartTheme.labelColour,
                },
            },
            area: {
                ...ChartTheme.getAreaSeriesDefaults(),
                normalizedTo: undefined,
                fillOpacity: 0.8,
                strokeOpacity: 1,
                strokeWidth: 2,
                lineDash: [0],
                lineDashOffset: 0,
                shadow: {
                    enabled: false,
                    color: ChartTheme.shadowColour,
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
                    fontFamily: ChartTheme.fontFamily,
                    color: ChartTheme.labelColour,
                    formatter: undefined,
                },
            },
            histogram: {
                ...ChartTheme.getSeriesDefaults(),
                strokeWidth: 1,
                fillOpacity: 1,
                strokeOpacity: 1,
                lineDash: [0],
                lineDashOffset: 0,
                areaPlot: false,
                bins: undefined,
                aggregation: 'sum',
                label: {
                    enabled: false,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: ChartTheme.fontFamily,
                    color: ChartTheme.labelColour,
                    formatter: undefined,
                },
                shadow: {
                    enabled: true,
                    color: ChartTheme.shadowColour,
                    xOffset: 0,
                    yOffset: 0,
                    blur: 5,
                },
            },
        },
    };

    private static readonly polarDefaults: AgPolarThemeOptions = {
        ...ChartTheme.getChartDefaults(),
        series: {
            pie: {
                ...ChartTheme.getSeriesDefaults(),
                title: {
                    enabled: true,
                    fontStyle: undefined,
                    fontWeight: 'bold',
                    fontSize: 14,
                    fontFamily: ChartTheme.fontFamily,
                    color: ChartTheme.labelColour,
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
                    fontFamily: ChartTheme.fontFamily,
                    color: ChartTheme.labelColour,
                    offset: 3,
                    minAngle: 0,
                },
                sectorLabel: {
                    enabled: true,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: ChartTheme.fontFamily,
                    color: ChartTheme.labelColour,
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
                    color: ChartTheme.shadowColour,
                    xOffset: 3,
                    yOffset: 3,
                    blur: 5,
                },
                innerLabels: {
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: ChartTheme.fontFamily,
                    color: ChartTheme.labelColour,
                    margin: 2,
                },
            },
        },
    };

    private static readonly hierarchyDefaults: AgHierarchyThemeOptions = {
        ...ChartTheme.getChartDefaults(),
        series: {
            treemap: {
                ...ChartTheme.getSeriesDefaults(),
                showInLegend: false,
                labelKey: 'label',
                sizeKey: 'size',
                colorKey: 'color',
                colorDomain: [-5, 5],
                colorRange: ['#cb4b3f', '#6acb64'],
                groupFill: '#272931',
                groupStroke: 'black',
                groupStrokeWidth: 1,
                tileStroke: 'black',
                tileStrokeWidth: 1,
                gradient: true,
                tileShadow: {
                    enabled: false,
                    color: ChartTheme.shadowColour,
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
                    color: 'white',
                    fontStyle: undefined,
                    fontWeight: 'bold',
                    fontSize: 12,
                    fontFamily: ChartTheme.fontFamily,
                    padding: 2,
                },
                subtitle: {
                    enabled: true,
                    color: 'white',
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 9,
                    fontFamily: ChartTheme.fontFamily,
                    padding: 2,
                },
                labels: {
                    large: {
                        enabled: true,
                        fontStyle: undefined,
                        fontWeight: 'bold',
                        fontSize: 18,
                        fontFamily: ChartTheme.fontFamily,
                        color: 'white',
                        wrapping: 'on-space',
                    },
                    medium: {
                        enabled: true,
                        fontStyle: undefined,
                        fontWeight: 'bold',
                        fontSize: 14,
                        fontFamily: ChartTheme.fontFamily,
                        color: 'white',
                        wrapping: 'on-space',
                    },
                    small: {
                        enabled: true,
                        fontStyle: undefined,
                        fontWeight: 'bold',
                        fontSize: 10,
                        fontFamily: ChartTheme.fontFamily,
                        color: 'white',
                        wrapping: 'on-space',
                    },
                    value: {
                        style: {
                            enabled: true,
                            fontStyle: undefined,
                            fontWeight: undefined,
                            fontSize: 12,
                            fontFamily: ChartTheme.fontFamily,
                            color: 'white',
                        },
                    },
                },
            },
        },
    };

    private static readonly defaults: ChartThemeDefaults = {
        cartesian: ChartTheme.cartesianDefaults,
        groupedCategory: ChartTheme.cartesianDefaults,
        polar: ChartTheme.polarDefaults,
        hierarchy: ChartTheme.hierarchyDefaults,
    };

    constructor(options?: AgChartThemeOptions) {
        options = deepMerge({}, options ?? {}) as AgChartThemeOptions;
        const { overrides = null, palette = null } = options;

        const defaults = this.createChartConfigPerChartType(this.getDefaults());

        if (overrides) {
            const { common, cartesian, polar, hierarchy } = overrides;

            const applyOverrides = <K extends keyof typeof defaults>(
                type: K,
                seriesTypes: string[],
                overrideOpts: AgChartThemeOverrides[K]
            ) => {
                if (overrideOpts) {
                    defaults[type] = deepMerge(defaults[type], overrideOpts);
                    seriesTypes.forEach((s) => {
                        const seriesType = s as keyof AgChartThemeOverrides;
                        defaults[seriesType] = deepMerge(defaults[seriesType], overrideOpts);
                    });
                }
            };
            applyOverrides('common', Object.keys(defaults) as any[], common);
            applyOverrides('cartesian', CHART_TYPES.cartesianTypes, cartesian);
            applyOverrides('polar', CHART_TYPES.polarTypes, polar);
            applyOverrides('hierarchy', CHART_TYPES.hierarchyTypes, hierarchy);

            CHART_TYPES.seriesTypes.forEach((s) => {
                const seriesType = s as keyof AgChartThemeOverrides;
                const chartConfig = overrides[seriesType];
                if (chartConfig) {
                    if (chartConfig.series) {
                        chartConfig.series = { [seriesType]: chartConfig.series };
                    }
                    defaults[seriesType] = deepMerge(defaults[seriesType], chartConfig);
                }
            });
        }
        this.palette = palette ?? this.getPalette();

        this.config = Object.freeze(defaults);
    }

    private createChartConfigPerChartType(config: ChartThemeDefaults) {
        const typeToAliases = {
            cartesian: CHART_TYPES.cartesianTypes,
            polar: CHART_TYPES.polarTypes,
            hierarchy: CHART_TYPES.hierarchyTypes,
            groupedCategory: [],
        };
        Object.entries(typeToAliases).forEach(([nextType, aliases]) => {
            const type = nextType as ChartType;
            const typeDefaults = this.templateTheme(getChartDefaults(type)) as any;

            aliases.forEach((next) => {
                const alias = next as keyof ChartThemeDefaults;
                if (!config[alias]) {
                    config[alias] = deepMerge({}, config[type]);
                    deepMerge(config[alias], typeDefaults);
                }
            });
        });

        return config as AgChartThemeOverrides;
    }

    protected getDefaults(): ChartThemeDefaults {
        const defaults = deepMerge({}, ChartTheme.defaults);
        const getOverridesByType = (chartType: ChartType, seriesTypes: string[]) => {
            const result = this.templateTheme(getChartDefaults(chartType)) as any;
            result.series = seriesTypes.reduce((obj, seriesType) => {
                const template = getSeriesThemeTemplate(seriesType);
                if (template) {
                    obj[seriesType] = this.templateTheme(template);
                }
                return obj;
            }, {} as Record<string, any>);

            if (chartType === 'cartesian' || chartType === 'polar') {
                result.axes = AXIS_TYPES.axesTypes.reduce((obj, axisType) => {
                    const template = getAxisThemeTemplate(axisType);
                    if (template) {
                        obj[axisType] = this.templateTheme(template);
                    }
                    return obj;
                }, {} as Record<string, any>);
            }
            return result;
        };

        const extension = {
            cartesian: getOverridesByType('cartesian', CHART_TYPES.cartesianTypes),
            groupedCategory: getOverridesByType('cartesian', CHART_TYPES.cartesianTypes),
            polar: getOverridesByType('polar', CHART_TYPES.polarTypes),
            hierarchy: getOverridesByType('hierarchy', CHART_TYPES.hierarchyTypes),
        };
        return deepMerge(defaults, extension);
    }

    protected templateTheme(themeTemplate: {}): {} {
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
        extensions.set(EXTENDS_SERIES_DEFAULTS, ChartTheme.getSeriesDefaults());
        extensions.set(OVERRIDE_SERIES_LABEL_DEFAULTS, {});

        const properties = new Map();
        properties.set(DEFAULT_FONT_FAMILY, ChartTheme.fontFamily);

        return {
            extensions,
            properties,
        };
    }

    protected mergeWithParentDefaults(
        parentDefaults: ChartThemeDefaults,
        defaults: ChartThemeDefaults
    ): ChartThemeDefaults {
        return deepMerge(parentDefaults, defaults);
    }
}
