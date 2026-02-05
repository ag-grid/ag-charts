import {
    BASE_FONT_SIZE,
    CARTESIAN_AXIS_TYPE,
    Color,
    DEFAULT_ANNOTATION_HANDLE_FILL,
    DEFAULT_ANNOTATION_STATISTICS_COLOR,
    DEFAULT_ANNOTATION_STATISTICS_DIVIDER_STROKE,
    DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL,
    DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE,
    DEFAULT_ANNOTATION_STATISTICS_FILL,
    DEFAULT_ANNOTATION_STATISTICS_STROKE,
    DEFAULT_CAPTION_ALIGNMENT,
    DEFAULT_CAPTION_LAYOUT_STYLE,
    DEFAULT_FIBONACCI_STROKES,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    DEFAULT_POLAR_SERIES_STROKE,
    DEFAULT_SHADOW_COLOUR,
    DEFAULT_SPARKLINE_CROSSHAIR_STROKE,
    DEFAULT_TEXTBOX_COLOR,
    DEFAULT_TEXTBOX_FILL,
    DEFAULT_TEXTBOX_STROKE,
    DEFAULT_TEXT_ANNOTATION_COLOR,
    DEFAULT_TOOLBAR_POSITION,
    FONT_SIZE_RATIO,
    IS_DARK_THEME,
    ModuleRegistry,
    ModuleType,
    PALETTE_ALT_DOWN_FILL,
    PALETTE_ALT_DOWN_STROKE,
    PALETTE_ALT_NEUTRAL_FILL,
    PALETTE_ALT_NEUTRAL_STROKE,
    PALETTE_ALT_UP_FILL,
    PALETTE_ALT_UP_STROKE,
    PALETTE_DOWN_FILL,
    PALETTE_DOWN_STROKE,
    PALETTE_NEUTRAL_FILL,
    PALETTE_NEUTRAL_STROKE,
    PALETTE_UP_FILL,
    PALETTE_UP_STROKE,
    POLAR_AXIS_TYPE,
    deepClone,
    deepFreeze,
    getSequentialColors,
    groupBy,
    isArray,
    jsonWalk,
    mergeDefaults,
} from 'ag-charts-core';
import type {
    AgChartTheme,
    AgChartThemeOptions,
    AgChartThemeOverrides,
    AgChartThemePalette,
    AgChartThemeParams,
    AgPaletteColors,
    AgPresetOverrides,
    AgThemeOverrides,
    CssColor,
    WithThemeParams,
} from 'ag-charts-types';

import { type PaletteType, paletteType } from '../../module/coreModulesTypes';
import type { ChartType } from '../factory/expectedModules';
import { DEFAULT_FILLS, DEFAULT_STROKES, type DefaultColors } from './defaultColors';

// If this changes, update plugins/ag-charts-generate-chart-thumbnail/src/executors/generate/generator/constants.ts
const DEFAULT_BACKGROUND_FILL = 'white';

type OverridesKey = keyof AgThemeOverrides;

const PRESET_OVERRIDES_TYPES: Record<keyof AgPresetOverrides, true> = {
    'radial-gauge': true,
    'linear-gauge': true,
};

function hasUserOptionLessThan1(key: string) {
    return {
        $some: [
            {
                $isUserOption: [`/series/$index/${key}`, { $lessThan: [{ $path: `/series/$index/${key}` }, 1] }, false],
            },
            { $path: '/series' },
        ],
    };
}

function isPresetOverridesType(type: OverridesKey): type is keyof AgPresetOverrides {
    return PRESET_OVERRIDES_TYPES[type as keyof AgPresetOverrides] === true;
}

export class ChartTheme {
    readonly palette: Required<AgChartThemePalette> & {
        sequentialColors: CssColor[][]; // TODO: AG-14186 make public
        altUp: AgPaletteColors;
        altDown: AgPaletteColors;
        altNeutral: AgPaletteColors;
    };
    readonly paletteType: PaletteType;

    readonly config: any;
    readonly presets: AgPresetOverrides;
    readonly overrides: AgThemeOverrides | undefined;
    readonly params: AgChartThemeParams;

    public static getDefaultColors(): DefaultColors {
        return {
            fills: DEFAULT_FILLS,
            fillsFallback: Object.values(DEFAULT_FILLS),
            strokes: DEFAULT_STROKES,
            sequentialColors: getSequentialColors(DEFAULT_FILLS),
            divergingColors: [DEFAULT_FILLS.ORANGE, DEFAULT_FILLS.YELLOW, DEFAULT_FILLS.GREEN],
            hierarchyColors: ['#fff', '#e0e5ea', '#c1ccd5', '#a3b4c1', '#859cad'],
            secondSequentialColors: Color.interpolate(
                [
                    Color.fromHexString(DEFAULT_FILLS.BLUE),
                    Color.fromHexString('#cbdef5'), // TODO: Color.lighten(DEFAULT_FILLS.BLUE, ?)
                ],
                8
            ).map((color) => color.toString()),
            secondDivergingColors: [DEFAULT_FILLS.GREEN, DEFAULT_FILLS.YELLOW, DEFAULT_FILLS.RED],
            secondHierarchyColors: ['#fff', '#c5cbd1', '#a4b1bd', '#8498a9', '#648096'],
            up: { fill: DEFAULT_FILLS.GREEN, stroke: DEFAULT_STROKES.GREEN },
            down: { fill: DEFAULT_FILLS.RED, stroke: DEFAULT_STROKES.RED },
            neutral: { fill: DEFAULT_FILLS.GRAY, stroke: DEFAULT_STROKES.GRAY },
            altUp: { fill: DEFAULT_FILLS.BLUE, stroke: DEFAULT_STROKES.BLUE },
            altDown: { fill: DEFAULT_FILLS.ORANGE, stroke: DEFAULT_STROKES.ORANGE },
            altNeutral: { fill: DEFAULT_FILLS.GRAY, stroke: DEFAULT_STROKES.GRAY },
        };
    }

    public static getDefaultPublicParameters(): Required<WithThemeParams<AgChartThemeParams>> {
        return {
            accentColor: '#2196f3',
            axisColor: { $foregroundBackgroundMix: 0.325 },
            backgroundColor: DEFAULT_BACKGROUND_FILL,
            borderColor: { $foregroundOpacity: 0.15 },
            borderRadius: 4,
            chartBackgroundColor: { $ref: 'backgroundColor' },
            chartPadding: 20,
            focusShadow: '0 0 0 3px var(--ag-charts-accent-color)',
            foregroundColor: '#181d1f',
            fontFamily: 'Verdana, sans-serif',
            fontSize: BASE_FONT_SIZE,
            fontWeight: 400,
            gridLineColor: { $foregroundBackgroundMix: 0.1 },
            popupShadow: '0 0 16px rgba(0, 0, 0, 0.15)',
            subtleTextColor: { $mix: [{ $ref: 'textColor' }, { $ref: 'chartBackgroundColor' }, 0.38] },
            textColor: { $ref: 'foregroundColor' },
            separationLinesColor: { $foregroundBackgroundMix: 0.17 },

            chromeBackgroundColor: { $foregroundBackgroundMix: 0.02 },
            chromeFontFamily: { $ref: 'fontFamily' } as any,
            chromeFontSize: { $ref: 'fontSize' },
            chromeFontWeight: { $ref: 'fontWeight' },
            chromeTextColor: { $ref: 'foregroundColor' },
            chromeSubtleTextColor: { $mix: [{ $ref: 'chromeTextColor' }, { $ref: 'backgroundColor' }, 0.38] },

            buttonBackgroundColor: { $ref: 'backgroundColor' },
            buttonBorder: true,
            buttonFontWeight: 400,
            buttonTextColor: { $ref: 'textColor' },

            inputBackgroundColor: { $ref: 'backgroundColor' },
            inputBorder: true,
            inputTextColor: { $ref: 'textColor' },

            menuBackgroundColor: { $ref: 'chromeBackgroundColor' },
            menuBorder: true,
            menuTextColor: { $ref: 'chromeTextColor' },

            panelBackgroundColor: { $ref: 'chromeBackgroundColor' },
            panelSubtleTextColor: { $ref: 'chromeSubtleTextColor' },

            tooltipBackgroundColor: { $ref: 'chromeBackgroundColor' },
            tooltipBorder: true,
            tooltipTextColor: { $ref: 'chromeTextColor' },
            tooltipSubtleTextColor: { $ref: 'chromeSubtleTextColor' },

            crosshairLabelBackgroundColor: { $ref: 'foregroundColor' },
            crosshairLabelTextColor: { $ref: 'chartBackgroundColor' },
        };
    }

    private static getAxisDefaults({ title, time }: { title: boolean; time: boolean }) {
        return mergeDefaults(
            title && {
                title: {
                    enabled: false,
                    text: 'Axis Title',
                    spacing: 25,
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $rem: FONT_SIZE_RATIO.MEDIUM },
                    fontFamily: { $ref: 'fontFamily' },
                    color: { $ref: 'textColor' },
                },
            },
            time && {
                parentLevel: {
                    enabled: false,
                    label: {
                        // TODO: { $merge: [{ $path: '../../label' }, { fontWeight: 'bold' }]}
                        enabled: { $path: '../../label/enabled' },
                        border: {
                            enabled: {
                                $or: [
                                    { $isUserOption: ['../border', true, false] },
                                    { $path: '../../../label/border/enabled' },
                                ],
                            },
                            strokeWidth: { $path: '../../../label/border/strokeWidth' },
                            stroke: { $path: '../../../label/border/stroke' },
                        },
                        fill: { $path: '../../label/fill' },
                        fontSize: { $path: '../../label/fontSize' },
                        fontFamily: { $path: '../../label/fontFamily' },
                        fontWeight: 'bold',
                        spacing: { $path: '../../label/spacing' },
                        color: { $path: '../../label/color' },
                        cornerRadius: { $path: '../../label/cornerRadius' },
                        padding: { $path: '../../label/padding' },
                        avoidCollisions: { $path: '../../label/avoidCollisions' },
                    },
                    tick: {
                        enabled: { $path: '../../tick/enabled' },
                        width: { $path: '../../tick/width' },
                        size: { $path: '../../tick/size' },
                        stroke: { $path: '../../tick/stroke' },
                    },
                },
            },
            {
                label: {
                    enabled: true,
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    fontWeight: { $ref: 'fontWeight' },
                    spacing: 11,
                    color: { $ref: 'textColor' },
                    avoidCollisions: true,
                    cornerRadius: 4,
                    border: {
                        enabled: { $isUserOption: ['../border', true, false] },
                        strokeWidth: 1,
                        stroke: { $foregroundOpacity: 0.08 },
                    },
                    padding: {
                        $if: [
                            { $eq: [{ $path: './border/enabled' }, true] },
                            { left: 12, right: 12, top: 8, bottom: 8 },
                            undefined,
                        ],
                    },
                },
                line: {
                    enabled: true,
                    width: 1,
                    stroke: { $ref: 'axisColor' },
                },
                tick: {
                    enabled: false,
                    size: 6,
                    width: 1,
                    stroke: { $ref: 'axisColor' },
                },
                gridLine: {
                    enabled: true,
                    width: 1,
                    style: {
                        $apply: [
                            {
                                fillOpacity: 1,
                                stroke: { $ref: 'gridLineColor' },
                                strokeWidth: { $path: '../../width' },
                                lineDash: [],
                            },
                            [
                                {
                                    fillOpacity: 1,
                                    stroke: { $ref: 'gridLineColor' },
                                    strokeWidth: { $path: '../../width' },
                                    lineDash: [],
                                },
                            ],
                        ],
                    },
                },
                crossLines: {
                    $apply: [
                        {
                            enabled: true,
                            fill: { $ref: 'foregroundColor' },
                            stroke: { $ref: 'foregroundColor' },
                            fillOpacity: 0.08,
                            strokeWidth: 1,
                            label: {
                                fontSize: { $ref: 'fontSize' },
                                fontFamily: { $ref: 'fontFamily' },
                                fontWeight: { $ref: 'fontWeight' },
                                padding: 5,
                                color: { $ref: 'textColor' },
                                border: {
                                    enabled: false,
                                    stroke: { $ref: 'foregroundColor' },
                                    strokeOpacity: 1,
                                    strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
                                },
                            },
                        },
                        undefined,
                        // TODO: can we just infer this common path?
                        // `axisType` path is relative to the axis that is currently being resolved
                        // e.g. `/axes/x/crossLines/[variables]` + `../type` = `/axes/x/type`
                        { $pathString: ['/common/axes/$axisType/crossLines', { axisType: { $path: ['../type'] } }] },
                        {
                            $pathString: [
                                '/$seriesType/axes/$axisType/crossLines',
                                {
                                    seriesType: { $path: ['/series/0/type', 'line'] },
                                    axisType: { $path: ['../type'] },
                                },
                            ],
                        },
                    ],
                },
            }
        );
    }

    protected getChartDefaults() {
        return {
            minHeight: 300,
            minWidth: 300,
            background: { visible: true, fill: { $ref: 'chartBackgroundColor' } },
            padding: {
                top: { $ref: 'chartPadding' },
                right: { $ref: 'chartPadding' },
                bottom: { $ref: 'chartPadding' },
                left: { $ref: 'chartPadding' },
            },
            seriesArea: {
                border: {
                    enabled: false,
                    stroke: { $ref: 'foregroundColor' },
                    strokeOpacity: 1,
                    strokeWidth: 1,
                },
                cornerRadius: 4,
                padding: { $if: [{ $eq: [{ $path: './border/enabled' }, true] }, 5, 0] },
            },
            keyboard: { enabled: true },
            title: {
                enabled: false,
                text: 'Title',
                spacing: { $if: [{ $path: '../subtitle/enabled' }, 10, 20] },
                fontWeight: { $ref: 'fontWeight' },
                fontSize: { $rem: FONT_SIZE_RATIO.LARGEST },
                fontFamily: { $ref: 'fontFamily' },
                color: { $ref: 'textColor' },
                wrapping: 'hyphenate',
                layoutStyle: DEFAULT_CAPTION_LAYOUT_STYLE,
                textAlign: DEFAULT_CAPTION_ALIGNMENT,
            },
            subtitle: {
                enabled: false,
                text: 'Subtitle',
                spacing: 20,
                fontWeight: { $ref: 'fontWeight' },
                fontSize: { $rem: FONT_SIZE_RATIO.MEDIUM },
                fontFamily: { $ref: 'fontFamily' },
                color: { $ref: 'subtleTextColor' },
                wrapping: 'hyphenate',
                layoutStyle: DEFAULT_CAPTION_LAYOUT_STYLE,
                textAlign: DEFAULT_CAPTION_ALIGNMENT,
            },
            footnote: {
                enabled: false,
                text: 'Footnote',
                spacing: 20,
                fontSize: { $rem: FONT_SIZE_RATIO.MEDIUM },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'subtleTextColor' },
                wrapping: 'hyphenate',
                layoutStyle: DEFAULT_CAPTION_LAYOUT_STYLE,
                textAlign: DEFAULT_CAPTION_ALIGNMENT,
            },
            highlight: {
                drawingMode: {
                    $if: [
                        {
                            $or: [
                                hasUserOptionLessThan1('highlight/highlightedItem/fillOpacity'),
                                hasUserOptionLessThan1('highlight/unhighlightedItem/fillOpacity'),
                                hasUserOptionLessThan1('highlight/highlightedSeries/fillOpacity'),
                                hasUserOptionLessThan1('highlight/unhighlightedSeries/fillOpacity'),
                                hasUserOptionLessThan1('highlight/highlightedItem/opacity'),
                                hasUserOptionLessThan1('highlight/unhighlightedItem/opacity'),
                                hasUserOptionLessThan1('highlight/highlightedSeries/opacity'),
                                hasUserOptionLessThan1('highlight/unhighlightedSeries/opacity'),
                                hasUserOptionLessThan1('fillOpacity'),
                                hasUserOptionLessThan1('marker/fillOpacity'),
                            ],
                        },
                        'overlap',
                        'cutout',
                    ],
                },
            },
            tooltip: {
                enabled: true,
                darkTheme: IS_DARK_THEME,
                delay: 0,
                pagination: false,
                mode: {
                    $if: [
                        {
                            $or: [
                                {
                                    $and: [
                                        { $isChartType: 'cartesian' },
                                        { $not: { $hasSeriesType: 'bubble' } },
                                        { $not: { $hasSeriesType: 'scatter' } },
                                        { $greaterThan: [{ $size: { $path: '/series' } }, 1] },
                                        { $lessThan: [{ $size: { $path: '/series' } }, 4] },
                                    ],
                                },
                                {
                                    $and: [
                                        { $isChartType: 'polar' },
                                        { $greaterThan: [{ $size: { $path: '/series' } }, 1] },
                                        { $lessThan: [{ $size: { $path: '/series' } }, 4] },
                                    ],
                                },
                            ],
                        },
                        'shared',
                        'single',
                    ],
                },
            },
            overlays: { darkTheme: IS_DARK_THEME },
            listeners: {},
            // TODO: remove this
            series: {
                tooltip: {
                    range: { $path: ['/tooltip/range', 'exact'] },
                    position: {
                        anchorTo: { $path: ['/tooltip/position/anchorTo', 'pointer'] },
                        placement: { $path: ['/tooltip/position/placement', undefined] },
                        xOffset: { $path: ['/tooltip/position/xOffset', 0] },
                        yOffset: { $path: ['/tooltip/position/yOffset', 0] },
                    },
                },
            },
        };
    }

    private static readonly axisDefault = {
        [CARTESIAN_AXIS_TYPE.NUMBER]: ChartTheme.getAxisDefaults({ title: true, time: false }),
        [CARTESIAN_AXIS_TYPE.LOG]: ChartTheme.getAxisDefaults({ title: true, time: false }),
        [CARTESIAN_AXIS_TYPE.CATEGORY]: ChartTheme.getAxisDefaults({ title: true, time: false }),
        [CARTESIAN_AXIS_TYPE.GROUPED_CATEGORY]: ChartTheme.getAxisDefaults({ title: true, time: false }),
        [CARTESIAN_AXIS_TYPE.TIME]: ChartTheme.getAxisDefaults({ title: true, time: true }),
        [CARTESIAN_AXIS_TYPE.UNIT_TIME]: ChartTheme.getAxisDefaults({ title: true, time: true }),
        [CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: ChartTheme.getAxisDefaults({ title: true, time: true }),
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: ChartTheme.getAxisDefaults({ title: false, time: false }),
        [POLAR_AXIS_TYPE.ANGLE_NUMBER]: ChartTheme.getAxisDefaults({ title: false, time: false }),
        [POLAR_AXIS_TYPE.RADIUS_CATEGORY]: ChartTheme.getAxisDefaults({ title: true, time: false }),
        [POLAR_AXIS_TYPE.RADIUS_NUMBER]: ChartTheme.getAxisDefaults({ title: true, time: false }),
    };

    constructor(options: AgChartTheme = {}) {
        const { overrides, palette, params } = deepClone(options) as AgChartThemeOptions;
        const defaults = this.createChartConfigPerChartType(this.getDefaults());
        const presets: Record<string, any> = {};

        if (overrides) {
            this.processOverrides(presets, overrides);
        }

        const { fills, strokes, sequentialColors, ...otherColors } = this.getDefaultColors();
        this.palette = deepFreeze(
            mergeDefaults(palette, {
                fills: Object.values(fills),
                strokes: Object.values(strokes),
                sequentialColors: Object.values(sequentialColors),
                ...otherColors,
            })
        );
        this.paletteType = paletteType(palette);

        this.params = mergeDefaults(params, this.getPublicParameters());

        this.config = deepFreeze(deepClone(defaults));
        this.overrides = deepFreeze(overrides);
        this.presets = deepFreeze(presets);
    }

    private processOverrides(presets: AgPresetOverrides, overrides: AgThemeOverrides) {
        for (const s of ModuleRegistry.listModulesByType(ModuleType.Series)) {
            const seriesType = s.name as keyof AgThemeOverrides;
            const seriesOverrides = overrides[seriesType];

            if (isPresetOverridesType(seriesType)) {
                presets[seriesType] = seriesOverrides as any;
                delete overrides[seriesType];
            }
        }
    }

    private createChartConfigPerChartType(config: AgChartThemeOverrides) {
        for (const chartModule of ModuleRegistry.listModulesByType(ModuleType.Chart)) {
            for (const seriesModule of ModuleRegistry.listModulesByType(ModuleType.Series)) {
                if (seriesModule.chartType !== chartModule.name) continue;
                config[seriesModule.name as keyof AgChartThemeOverrides] ??= chartModule.themeTemplate;
            }
        }
        return config;
    }

    private getDefaults(): AgChartThemeOverrides {
        const getOverridesByType = (chartType: ChartType, seriesTypes: string[]) => {
            const result: Record<string, { series?: object; axes?: object }> = {};
            const chartTypeDefaults = mergeDefaults(
                { axes: {} },
                ...Array.from(ModuleRegistry.listModulesByType(ModuleType.Plugin), (p) => ({
                    [p.name]: p.themeTemplate,
                })),
                ModuleRegistry.getChartModule(chartType)?.themeTemplate,
                this.getChartDefaults()
            );

            for (const seriesType of seriesTypes) {
                result[seriesType] = mergeDefaults(
                    getSeriesThemeTemplate(seriesType),
                    result[seriesType] ?? chartTypeDefaults
                );

                const { axes } = result[seriesType] as { axes: Record<string, object> };

                for (const axisModule of ModuleRegistry.listModulesByType(ModuleType.Axis)) {
                    axes[axisModule.name] = mergeDefaults(
                        axes[axisModule.name],
                        !axisModule.chartType || axisModule.chartType === chartType
                            ? getAxisThemeTemplate(axisModule.name)
                            : null,
                        (ChartTheme.axisDefault as any)[axisModule.name]
                    );
                }

                // TODO: remove this
                if (seriesType === 'map-shape-background' || seriesType === 'map-line-background') {
                    delete (result[seriesType].series as any).tooltip;
                }
            }

            return result;
        };

        const seriesModules = [...ModuleRegistry.listModulesByType(ModuleType.Series)];
        const seriesByChartType = groupBy(seriesModules, (s) => s.chartType || 'unknown');

        return mergeDefaults(
            ...Object.keys(seriesByChartType).map((chartType) =>
                getOverridesByType(chartType as ChartType, seriesByChartType[chartType]?.map((s) => s.name) ?? [])
            )
        );
    }

    private static applyTemplateTheme(this: void, node: any, _other: any, params?: Map<any, any>) {
        if (isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                const symbol = node[i];
                if (typeof symbol === 'symbol' && params?.has(symbol)) {
                    node[i] = params.get(symbol);
                }
            }
        } else {
            for (const name of Object.keys(node)) {
                const value = node[name];
                if (typeof value === 'symbol' && params?.has(value)) {
                    node[name] = params.get(value);
                }
            }
        }
    }

    templateTheme<T>(themeTemplate: T, clone = true): T {
        const themeInstance = clone ? deepClone(themeTemplate) : themeTemplate;
        const params = this.getTemplateParameters();

        jsonWalk(themeInstance, ChartTheme.applyTemplateTheme, undefined, undefined, params);

        return themeInstance;
    }

    protected getDefaultColors(): DefaultColors {
        return ChartTheme.getDefaultColors();
    }

    getPublicParameters(): Required<WithThemeParams<AgChartThemeParams>> {
        return ChartTheme.getDefaultPublicParameters();
    }

    // Private parameters that are not exposed in the themes API.
    getTemplateParameters() {
        const params = new Map();
        params.set(IS_DARK_THEME, false);
        params.set(DEFAULT_SHADOW_COLOUR, '#00000080');
        params.set(DEFAULT_SPARKLINE_CROSSHAIR_STROKE, '#aaa');
        params.set(DEFAULT_CAPTION_LAYOUT_STYLE, 'block');
        params.set(DEFAULT_CAPTION_ALIGNMENT, 'center');
        params.set(DEFAULT_FIBONACCI_STROKES, [
            '#797b86',
            '#e24c4a',
            '#f49d2d',
            '#65ab58',
            '#409682',
            '#4db9d2',
            '#5090dc',
            '#3068f9',
            '#e24c4a',
            '#913aac',
            '#d93e64',
        ]);
        params.set(DEFAULT_POLAR_SERIES_STROKE, DEFAULT_BACKGROUND_FILL);

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, DEFAULT_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, DEFAULT_FILLS.BLUE);
        params.set(DEFAULT_TEXT_ANNOTATION_COLOR, DEFAULT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_HANDLE_FILL, DEFAULT_BACKGROUND_FILL);
        params.set(DEFAULT_ANNOTATION_STATISTICS_FILL, '#fafafa');
        params.set(DEFAULT_ANNOTATION_STATISTICS_STROKE, '#ddd');
        params.set(DEFAULT_ANNOTATION_STATISTICS_COLOR, '#000');
        params.set(DEFAULT_ANNOTATION_STATISTICS_DIVIDER_STROKE, '#181d1f');
        params.set(DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL, '#e35c5c');
        params.set(DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE, '#e35c5c');

        params.set(DEFAULT_TEXTBOX_FILL, '#fafafa');
        params.set(DEFAULT_TEXTBOX_STROKE, '#ddd');
        params.set(DEFAULT_TEXTBOX_COLOR, '#000');

        params.set(DEFAULT_TOOLBAR_POSITION, 'top');

        const defaultColors = this.getDefaultColors();
        params.set(PALETTE_UP_STROKE, this.palette.up?.stroke ?? defaultColors.up.stroke);
        params.set(PALETTE_UP_FILL, this.palette.up?.fill ?? defaultColors.up.fill);
        params.set(PALETTE_DOWN_STROKE, this.palette.down?.stroke ?? defaultColors.down.stroke);
        params.set(PALETTE_DOWN_FILL, this.palette.down?.fill ?? defaultColors.down.fill);
        params.set(PALETTE_NEUTRAL_STROKE, this.palette.neutral?.stroke ?? defaultColors.neutral.stroke);
        params.set(PALETTE_NEUTRAL_FILL, this.palette.neutral?.fill ?? defaultColors.neutral.fill);
        params.set(PALETTE_ALT_UP_STROKE, this.palette.altUp?.stroke ?? defaultColors.up.stroke);
        params.set(PALETTE_ALT_UP_FILL, this.palette.altUp?.fill ?? defaultColors.up.fill);
        params.set(PALETTE_ALT_DOWN_STROKE, this.palette.altDown?.stroke ?? defaultColors.down.stroke);
        params.set(PALETTE_ALT_DOWN_FILL, this.palette.altDown?.fill ?? defaultColors.down.fill);
        params.set(PALETTE_ALT_NEUTRAL_FILL, this.palette.altNeutral?.fill ?? defaultColors.altNeutral.fill);
        params.set(PALETTE_ALT_NEUTRAL_STROKE, this.palette.altNeutral?.stroke ?? defaultColors.altNeutral.stroke);

        return params;
    }
}

function getAxisThemeTemplate(axisType: string) {
    let themeTemplate = ModuleRegistry.getAxisModule(axisType)?.themeTemplate ?? {};
    for (const module of ModuleRegistry.listModulesByType(ModuleType.AxisPlugin)) {
        if (module.axisTypes?.includes(axisType) ?? true) {
            themeTemplate = mergeDefaults({ [module.name]: module.themeTemplate }, themeTemplate);
        }
    }
    return themeTemplate;
}

function getSeriesThemeTemplate(seriesType: string) {
    let themeTemplate = ModuleRegistry.getSeriesModule(seriesType)?.themeTemplate ?? {};
    for (const module of ModuleRegistry.listModulesByType(ModuleType.SeriesPlugin)) {
        if (module.seriesTypes?.includes(seriesType) ?? true) {
            themeTemplate = mergeDefaults({ series: { [module.name]: module.themeTemplate } }, themeTemplate);
        }
    }
    return themeTemplate;
}
