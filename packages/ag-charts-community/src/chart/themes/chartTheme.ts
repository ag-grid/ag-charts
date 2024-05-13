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
import { axisRegistry } from '../factory/axisRegistry';
import { type ChartType, chartDefaults, chartTypes } from '../factory/chartTypes';
import { legendRegistry } from '../factory/legendRegistry';
import { seriesRegistry } from '../factory/seriesRegistry';
import { CARTESIAN_AXIS_TYPE, FONT_SIZE, FONT_WEIGHT, POSITION } from './constants';
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
    EXTENDS_AXES_DEFAULTS,
    EXTENDS_AXES_GRID_LINE_DEFAULTS,
    EXTENDS_AXES_LINE_DEFAULTS,
    EXTENDS_AXES_TICK_DEFAULTS,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    EXTENDS_SERIES_DEFAULTS,
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
    get sankey(): ChartTypeConfig {
        return { seriesTypes: chartTypes.topologyTypes, commonOptions: [] };
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
                color: DEFAULT_AXIS_LINE_COLOUR,
            },
            tick: {
                enabled: false,
                width: 1,
                color: DEFAULT_AXIS_LINE_COLOUR,
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

    private static getSeriesDefaults() {
        return {
            visible: true,
            showInLegend: true,
            highlightStyle: {
                item: { fill: '#ffffff54', stroke: `#0006`, strokeWidth: 2 },
                series: { dimOpacity: 1 },
            },
            nodeClickRange: 'exact' as InteractionRange,
            tooltip: { enabled: true },
        };
    }

    private static getCartesianSeriesMarkerDefaults() {
        return { enabled: true, shape: 'circle', size: 7, strokeWidth: 1 };
    }

    private static getChartDefaults() {
        return {
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
                item: {
                    paddingX: 16,
                    paddingY: 8,
                    marker: { size: 15, padding: 8 },
                    toggleSeriesVisible: true,
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
                range: 'nearest' as InteractionRange,
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
                        chartType === 'cartesian' && (ChartTheme.cartesianAxisDefault as any)[axisType]
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
            getOverridesByType('sankey', chartTypes.sankeyTypes)
        );
    }

    templateTheme<T>(themeTemplate: T): T {
        const themeInstance = deepClone(themeTemplate);
        const { extensions, properties } = this.getTemplateParameters();

        jsonWalk(themeInstance, (node: any) => {
            if (node['__extends__']) {
                const extendsValue = node['__extends__'];
                const source = extensions.get(extendsValue);
                if (source == null) {
                    throw new Error(`AG Charts - no template variable provided for: ${extendsValue}`);
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
        const extensions = new Map();

        extensions.set(EXTENDS_AXES_DEFAULTS, ChartTheme.getAxisDefaults());
        extensions.set(EXTENDS_AXES_LINE_DEFAULTS, ChartTheme.getAxisDefaults().line);
        extensions.set(EXTENDS_AXES_TICK_DEFAULTS, ChartTheme.getAxisDefaults().tick);
        extensions.set(EXTENDS_AXES_GRID_LINE_DEFAULTS, ChartTheme.getAxisDefaults().gridLine);

        extensions.set(EXTENDS_SERIES_DEFAULTS, ChartTheme.getSeriesDefaults());
        extensions.set(EXTENDS_CARTESIAN_MARKER_DEFAULTS, ChartTheme.getCartesianSeriesMarkerDefaults());

        const properties = new Map();
        properties.set(IS_DARK_THEME, false);
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
        properties.set(DEFAULT_COLOURS, ChartTheme.getDefaultColors());
        properties.set(DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS, ChartTheme.getWaterfallSeriesDefaultPositiveColors());
        properties.set(DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS, ChartTheme.getWaterfallSeriesDefaultNegativeColors());
        properties.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, ChartTheme.getWaterfallSeriesDefaultTotalColors());
        properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            ChartTheme.getWaterfallSeriesDefaultTotalColors().stroke
        );
        properties.set(DEFAULT_ANNOTATION_STROKE, DEFAULT_STROKES.BLUE);
        properties.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, DEFAULT_FILLS.BLUE);
        properties.set(DEFAULT_ANNOTATION_HANDLE_FILL, DEFAULT_BACKGROUND_FILL);

        return {
            extensions,
            properties,
        };
    }
}
