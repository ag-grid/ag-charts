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
import { BOTTOM, NORMAL } from './constants';
import {
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
    DEFAULT_FONT_FAMILY,
    DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
    DEFAULT_INVERTED_LABEL_COLOUR,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    DEFAULT_SHADOW_COLOUR,
    DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
    EXTENDS_AXES_DEFAULTS,
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

const palette: AgChartThemePalette = {
    fills: [
        '#436ff4',
        '#9a7bff',
        '#d165d2',
        '#f0598b',
        '#f47348',
        '#f2a602',
        '#e9e201',
        '#21b448',
        '#00b9a2',
        '#00aee4',
    ],
    strokes: [
        '#132baf',
        '#623bba',
        '#8f2291',
        '#a90352',
        '#ae3200',
        '#a55f00',
        '#8f8500',
        '#007500',
        '#007762',
        '#006fa3',
    ],
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

    private static getAxisGridlineStyleDefaults() {
        return [
            {
                stroke: DEFAULT_AXIS_GRID_COLOUR,
                lineDash: [],
            },
        ];
    }

    private static getAxisDefaults() {
        return {
            top: {},
            right: {},
            bottom: {},
            left: {},
            title: {
                enabled: false,
                text: 'Axis Title',
                spacing: 15,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
            label: {
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                padding: 5,
                rotation: undefined,
                color: DEFAULT_LABEL_COLOUR,
                formatter: undefined,
                avoidCollisions: true,
            },
            line: {
                width: 1,
                color: 'rgb(195, 195, 195)',
            },
            tick: {
                width: 1,
                color: 'rgb(195, 195, 195)',
            },
            gridStyle: ChartTheme.getAxisGridlineStyleDefaults(),
            gridline: {
                style: ChartTheme.getAxisGridlineStyleDefaults(),
            },
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
            strokeWidth: 2,
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
                fontSize: 16,
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
                fontSize: 12,
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
                fontSize: 12,
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
                        fontSize: 12,
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
            tick: {
                ...ChartTheme.getAxisDefaults().tick,
                enabled: false,
            },
            gridline: {
                ...ChartTheme.getAxisDefaults().gridline,
                enabled: false,
            },
        },
        groupedCategory: {
            ...ChartTheme.getAxisDefaults(),
        },
        time: {
            ...ChartTheme.getAxisDefaults(),
            tick: {
                ...ChartTheme.getAxisDefaults().tick,
                enabled: false,
            },
            gridline: {
                ...ChartTheme.getAxisDefaults().gridline,
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
        extensions.set(EXTENDS_CHART_DEFAULTS, ChartTheme.getChartDefaults());
        extensions.set(EXTENDS_AXES_DEFAULTS, ChartTheme.getAxisDefaults());
        extensions.set(EXTENDS_LEGEND_DEFAULTS, ChartTheme.getChartDefaults().legend);
        extensions.set(EXTENDS_LEGEND_ITEM_DEFAULTS, ChartTheme.getChartDefaults().legend.item);
        extensions.set(EXTENDS_LEGEND_ITEM_MARKER_DEFAULTS, ChartTheme.getLegendItemMarkerDefaults());
        extensions.set(EXTENDS_AXES_LABEL_DEFAULTS, ChartTheme.getAxisDefaults().label);
        extensions.set(EXTENDS_AXES_LINE_DEFAULTS, ChartTheme.getAxisDefaults().line);
        extensions.set(EXTENDS_AXES_TICK_DEFAULTS, ChartTheme.getAxisDefaults().tick);
        extensions.set(EXTENDS_SERIES_DEFAULTS, ChartTheme.getSeriesDefaults());
        extensions.set(OVERRIDE_SERIES_LABEL_DEFAULTS, {});
        extensions.set(EXTENDS_CARTESIAN_MARKER_DEFAULTS, ChartTheme.getCartesianSeriesMarkerDefaults());

        const properties = new Map();
        properties.set(DEFAULT_FONT_FAMILY, 'Verdana, sans-serif');
        properties.set(DEFAULT_LABEL_COLOUR, 'rgb(70, 70, 70)');
        properties.set(DEFAULT_INVERTED_LABEL_COLOUR, 'white');
        properties.set(DEFAULT_MUTED_LABEL_COLOUR, 'rgb(140, 140, 140)');
        properties.set(DEFAULT_AXIS_GRID_COLOUR, 'rgb(224,234,241)');
        properties.set(DEFAULT_INSIDE_SERIES_LABEL_COLOUR, 'white');
        properties.set(DEFAULT_BACKGROUND_COLOUR, 'white');
        properties.set(DEFAULT_SHADOW_COLOUR, 'rgba(0, 0, 0, 0.5)');
        properties.set(DEFAULT_TREEMAP_TILE_BORDER_COLOUR, 'black');

        return {
            extensions,
            properties,
        };
    }
}
