import {
    BASE_FONT_SIZE,
    Color,
    type ContributionHost,
    FONT_SIZE_RATIO,
    ModuleRegistry,
    type ModuleScope,
    ModuleType,
    type OptionsContribution,
    type PlainObject,
    contributionMatchesAxisType,
    contributionMatchesChartType,
    contributionMatchesSeriesType,
    createScopedCache,
    deepClone,
    deepFreeze,
    getSequentialColors,
    groupBy,
    mergeDefaults,
    mergeDefaultsShallowOperations,
    nestAtOptionsPath,
} from 'ag-charts-core';
import type {
    AgChartAllThemeParams,
    AgChartPrivateThemeParams,
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
import type { ChartType } from '../chartType';
import { DEFAULT_FILLS, DEFAULT_STROKES, type DefaultColors } from './defaultColors';

// If this changes, update plugins/ag-charts-generate-chart-thumbnail/src/executors/generate/generator/constants.ts
const DEFAULT_BACKGROUND_FILL = '#ffffff';

type OverridesKey = keyof AgThemeOverrides;

const PRESET_OVERRIDES_TYPES: Record<keyof AgPresetOverrides, true> = {
    'radial-gauge': true,
    'linear-gauge': true,
};

function isPresetOverridesType(type: OverridesKey): type is keyof AgPresetOverrides {
    return PRESET_OVERRIDES_TYPES[type as keyof AgPresetOverrides] === true;
}

/**
 * The frozen per-series-type defaults a `ChartTheme` bakes into `config` depend on the theme class, the
 * preset and the module registry — never on the instance's own overrides, palette or params. Building them
 * means merging every series, axis and plugin theme template, then deep-cloning and deep-freezing the result,
 * which dominated the cost of `new ChartTheme(...)` for every distinct theme-options object (each one misses
 * the identity-keyed cache in `mapping/themes.ts`). They are built once per class and preset per module scope
 * and shared, which is safe because the result is frozen; a registry change empties the scope's entries.
 */
const defaultsConfigCache = createScopedCache(
    () => ({ byClass: new WeakMap<Function, Map<string | undefined, any>>() }),
    (cache) => {
        cache.byClass = new WeakMap();
    }
);

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
    readonly params: AgChartAllThemeParams;
    readonly isDark: boolean = false;

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
            axisLineColor: { $ref: 'borderColor' },
            axisLineWidth: 1,
            backgroundColor: DEFAULT_BACKGROUND_FILL,
            bandHighlightColor: { $foregroundBackgroundMix: 0.05 },
            borderColor: { $foregroundBackgroundMix: 0.15 },
            borderRadius: 4,
            borderWidth: 1,
            cardShadow: { $ref: 'popupShadow' },
            chartBackgroundColor: { $ref: 'backgroundColor' },
            chartPadding: 20,
            focusShadow: '0 0 0 3px color-mix(in srgb, var(--ag-charts-accent-color) 50%, transparent)',
            foregroundColor: '#181d1f',
            fontFamily:
                '"IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
            fontSize: BASE_FONT_SIZE,
            fontWeight: 400,
            gridLineColor: { $mix: [{ $ref: 'axisLineColor' }, { $ref: 'backgroundColor' }, 0.35] },
            gridLineWidth: 1,
            popupShadow: '0 0 16px rgba(0, 0, 0, 0.15)',
            subtleTextColor: { $mix: [{ $ref: 'textColor' }, { $ref: 'chartBackgroundColor' }, 0.38] },
            textColor: { $ref: 'foregroundColor' },

            chromeBackgroundColor: { $foregroundBackgroundMix: 0.02 },
            chromeFontFamily: { $ref: 'fontFamily' },
            chromeFontSize: { $ref: 'fontSize' },
            chromeFontWeight: { $ref: 'fontWeight' },
            chromeTextColor: { $ref: 'textColor' },
            chromeSubtleTextColor: { $mix: [{ $ref: 'chromeTextColor' }, { $ref: 'backgroundColor' }, 0.38] },

            axisLabelColor: { $ref: 'textColor' },
            axisLabelFontFamily: { $ref: 'fontFamily' },
            axisLabelFontSize: { $ref: 'fontSize' },
            axisLabelFontWeight: { $ref: 'fontWeight' },
            axisTitleColor: { $ref: 'textColor' },
            axisTitleFontFamily: { $ref: 'fontFamily' },
            axisTitleFontSize: { $rem: FONT_SIZE_RATIO.MEDIUM },
            axisTitleFontWeight: { $ref: 'fontWeight' },

            buttonBackgroundColor: { $ref: 'backgroundColor' },
            buttonBorder: {
                color: { $ref: 'borderColor' },
                width: { $ref: 'borderWidth' },
            },
            buttonBorderRadius: { $ref: 'borderRadius' },
            buttonFontWeight: 400,
            buttonTextColor: { $ref: 'chromeTextColor' },
            buttonHoverBackgroundColor: { $mix: [{ $ref: 'backgroundColor' }, { $ref: 'accentColor' }, 0.12] },
            buttonHoverBorder: { $ref: 'buttonBorder' },
            buttonHoverTextColor: { $ref: 'buttonTextColor' },
            buttonActiveBackgroundColor: { $mix: [{ $ref: 'backgroundColor' }, { $ref: 'accentColor' }, 0.12] },
            buttonActiveBorder: { color: { $ref: 'accentColor' } },
            buttonActiveTextColor: { $ref: 'accentColor' },
            buttonDisabledBackgroundColor: {
                $mix: [{ $ref: 'chromeBackgroundColor' }, { $ref: 'foregroundColor' }, 0.06],
            },
            buttonDisabledBorder: { $ref: 'buttonBorder' },
            buttonDisabledTextColor: { $mix: [{ $ref: 'chromeBackgroundColor' }, { $ref: 'buttonTextColor' }, 0.5] },
            buttonHorizontalPadding: 9,
            buttonVerticalPadding: 6,

            inputBackgroundColor: { $ref: 'backgroundColor' },
            inputBorder: {
                color: { $ref: 'borderColor' },
                width: { $ref: 'borderWidth' },
            },
            inputBorderRadius: { $ref: 'borderRadius' },
            inputPlaceholderTextColor: { $mix: [{ $ref: 'inputTextColor' }, { $ref: 'inputBackgroundColor' }, 0.4] },
            inputTextColor: { $ref: 'textColor' },

            menuBackgroundColor: { $ref: 'chromeBackgroundColor' },
            menuBorder: {
                color: { $ref: 'borderColor' },
                width: { $ref: 'borderWidth' },
            },
            menuBorderRadius: { $ref: 'borderRadius' },
            menuSeparatorColor: { $ref: 'borderColor' },
            menuTextColor: { $ref: 'chromeTextColor' },

            panelBackgroundColor: { $ref: 'chromeBackgroundColor' },
            panelSubtleTextColor: { $ref: 'chromeSubtleTextColor' },

            tooltipBackgroundColor: { $ref: 'chromeBackgroundColor' },
            tooltipBorder: {
                color: { $ref: 'borderColor' },
                width: { $ref: 'borderWidth' },
            },
            tooltipBorderRadius: { $ref: 'borderRadius' },
            tooltipTextColor: { $ref: 'chromeTextColor' },
            tooltipSubtleTextColor: { $ref: 'chromeSubtleTextColor' },

            crosshairLabelBackgroundColor: { $ref: 'foregroundColor' },
            crosshairLabelTextColor: { $ref: 'chartBackgroundColor' },

            titleFontSize: { $rem: FONT_SIZE_RATIO.LARGEST },
            titleFontWeight: { $ref: 'fontWeight' },
            titleFontFamily: { $ref: 'fontFamily' },
            titleColor: { $ref: 'textColor' },
            subtitleFontSize: { $rem: FONT_SIZE_RATIO.MEDIUM },
            subtitleFontWeight: { $ref: 'fontWeight' },
            subtitleFontFamily: { $ref: 'fontFamily' },
            subtitleColor: { $ref: 'subtleTextColor' },
            footnoteFontSize: { $rem: FONT_SIZE_RATIO.MEDIUM },
            footnoteFontWeight: { $ref: 'fontWeight' },
            footnoteFontFamily: { $ref: 'fontFamily' },
            footnoteColor: { $ref: 'subtleTextColor' },

            groupedCategoryLineColor: { $foregroundBackgroundMix: 0.17 },

            legendBorder: false,
            legendBorderRadius: { $ref: 'borderRadius' },
            legendItemHorizontalPadding: 8,
            legendItemVerticalPadding: 4,
            legendLabelColor: { $ref: 'textColor' },
            legendLabelFontFamily: { $ref: 'fontFamily' },
            legendLabelFontSize: { $rem: FONT_SIZE_RATIO.SMALL },
            legendLabelFontWeight: { $ref: 'fontWeight' },
            legendMarkerSize: 15,
            legendPadding: 5,
            colorPickerColorBorderRadius: { $multiply: [0.5, { $ref: 'borderRadius' }] },
            colorPickerThumbBorderWidth: 3,
            colorPickerThumbSize: 18,
            colorPickerTrackBorderRadius: { $multiply: [99, { $ref: 'borderRadius' }] },
            colorPickerTrackSize: 12,
            dragHandleColor: { $ref: 'chromeTextColor' },

            // The border mixes reproduce the scrollbar colours that predate these params.
            scrollbarThickness: 12,
            scrollbarTrackBackgroundColor: { $foregroundBackgroundMix: 0.03 },
            scrollbarTrackBorder: {
                color: { $mix: [{ $ref: 'borderColor' }, { $ref: 'foregroundColor' }, 0.031] },
                width: { $ref: 'borderWidth' },
            },
            scrollbarTrackBorderRadius: 6,
            scrollbarThumbBackgroundColor: { $foregroundBackgroundMix: 0.125 },
            scrollbarThumbBorder: {
                color: { $mix: [{ $ref: 'borderColor' }, { $ref: 'foregroundColor' }, 0.2513] },
                width: { $ref: 'borderWidth' },
            },
            scrollbarThumbBorderRadius: 6,
            scrollbarThumbHoverBackgroundColor: {
                $mix: [{ $ref: 'scrollbarThumbBackgroundColor' }, { $ref: 'foregroundColor' }, 0.075],
            },
            scrollbarThumbHoverBorder: {
                // A boolean scrollbarThumbBorder has no members, and its thumb border uses borderColor.
                color: {
                    $if: [
                        { $isType: [{ $ref: 'scrollbarThumbBorder' }, 'boolean'] },
                        { $mix: [{ $ref: 'borderColor' }, { $ref: 'foregroundColor' }, 0.075] },
                        { $mix: [{ $ref: 'scrollbarThumbBorder.color' }, { $ref: 'foregroundColor' }, 0.075] },
                    ],
                },
                width: { $ref: 'scrollbarThumbBorder.width' },
            },
        };
    }

    private static getPrivateParameters(): Required<
        WithThemeParams<Omit<AgChartPrivateThemeParams, 'annotationColor'>>
    > {
        return {
            focusColor: { $mix: [{ $ref: 'backgroundColor' }, { $ref: 'accentColor' }, 0.12] },
            captionLayoutStyle: 'block',
            captionAlignment: 'center',
        };
    }

    constructor(
        options: AgChartTheme = {},
        presetName?: string,
        moduleRegistry: ModuleScope = ModuleRegistry.resolveModuleScope()
    ) {
        const { overrides, palette, params } = deepClone(options) as AgChartThemeOptions;
        const presets: Record<string, any> = {};

        if (overrides) {
            this.processOverrides(presets, overrides, moduleRegistry);
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

        this.params = mergeDefaults(params, this.getThemeParameters() as AgChartAllThemeParams);

        this.config = this.getFrozenDefaultsConfig(presetName, moduleRegistry);
        this.overrides = deepFreeze(overrides);
        this.presets = deepFreeze(presets);
    }

    private getFrozenDefaultsConfig(presetName: string | undefined, moduleRegistry: ModuleScope) {
        const { byClass } = defaultsConfigCache.for(moduleRegistry);
        let byPreset = byClass.get(this.constructor);
        if (byPreset == null) {
            byPreset = new Map();
            byClass.set(this.constructor, byPreset);
        }
        let config = byPreset.get(presetName);
        if (config == null) {
            const defaults = this.createChartConfigPerChartType(
                this.getDefaults(presetName, moduleRegistry),
                moduleRegistry
            );
            config = deepFreeze(deepClone(defaults));
            byPreset.set(presetName, config);
        }
        return config;
    }

    private processOverrides(presets: AgPresetOverrides, overrides: AgThemeOverrides, moduleRegistry: ModuleScope) {
        for (const s of moduleRegistry.listModulesByType(ModuleType.Series)) {
            const seriesType = s.name as keyof AgThemeOverrides;
            const seriesOverrides = overrides[seriesType];

            if (isPresetOverridesType(seriesType)) {
                presets[seriesType] = seriesOverrides as any;
                delete overrides[seriesType];
            }
        }
    }

    private createChartConfigPerChartType(config: AgChartThemeOverrides, moduleRegistry: ModuleScope) {
        for (const chartModule of moduleRegistry.listModulesByType(ModuleType.Chart)) {
            for (const seriesModule of moduleRegistry.listModulesByType(ModuleType.Series)) {
                if (seriesModule.chartType !== chartModule.name) continue;
                config[seriesModule.name as keyof AgChartThemeOverrides] ??= chartModule.themeTemplate;
            }
        }
        return config;
    }

    private getDefaults(presetName: string | undefined, moduleRegistry: ModuleScope): AgChartThemeOverrides {
        const presetModule = presetName == null ? undefined : moduleRegistry.getPresetModule(presetName);
        const presetTemplate = presetModule?.themeTemplate;

        const getOverridesByType = (chartType: ChartType, seriesTypes: string[]) => {
            const result: Record<string, { series?: object; axes?: object }> = {};
            const chartTypeDefaults = mergeDefaultsShallowOperations(
                { axes: {} },
                presetTemplate?.common,
                ...contributedThemeTemplates(moduleRegistry, 'chart', (c) =>
                    contributionMatchesChartType(c, chartType)
                ),
                moduleRegistry.getChartModule(chartType)?.themeTemplate
            );

            for (const seriesType of seriesTypes) {
                result[seriesType] = mergeDefaultsShallowOperations(
                    (presetTemplate as any)?.[seriesType],
                    getSeriesThemeTemplate(seriesType, moduleRegistry),
                    result[seriesType] ?? chartTypeDefaults
                );

                // Remove these keys from the compiled theme to treat them as `undefined` in the preset theme with
                // priority over the series theme.
                if (presetModule?.removeThemeSeriesKeys && result[seriesType].series) {
                    for (const key of presetModule.removeThemeSeriesKeys) {
                        if (key in result[seriesType].series) {
                            delete (result as any)[seriesType].series[key];
                        }
                    }
                }

                const { axes } = result[seriesType] as { axes: Record<string, object> };

                for (const axisModule of moduleRegistry.listModulesByType(ModuleType.Axis)) {
                    axes[axisModule.name] = mergeDefaultsShallowOperations(
                        axes[axisModule.name],
                        axisModule.chartType == null || axisModule.chartType === chartType
                            ? getAxisThemeTemplate(axisModule.name, moduleRegistry)
                            : null
                    );
                }

                // TODO: remove this
                if (seriesType === 'map-shape-background' || seriesType === 'map-line-background') {
                    delete (result[seriesType].series as any).tooltip;
                }
            }

            return result;
        };

        const seriesModules = [...moduleRegistry.listModulesByType(ModuleType.Series)];
        const seriesByChartType = groupBy(seriesModules, (s) => s.chartType ?? 'unknown');

        return mergeDefaultsShallowOperations(
            ...Object.keys(seriesByChartType).map((chartType) =>
                getOverridesByType(chartType as ChartType, seriesByChartType[chartType]?.map((s) => s.name) ?? [])
            )
        );
    }

    protected getDefaultColors(): DefaultColors {
        return ChartTheme.getDefaultColors();
    }

    getThemeParameters(): Required<WithThemeParams<AgChartAllThemeParams>> {
        return {
            ...ChartTheme.getDefaultPublicParameters(),
            ...ChartTheme.getPrivateParameters(),
            annotationColor: this.getDefaultColors().fills.BLUE,
        };
    }
}

/** Each contributed theme template nested at its path relative to `host`, in registry order. */
function contributedThemeTemplates(
    moduleRegistry: ModuleScope,
    host: ContributionHost,
    applies: (contribution: OptionsContribution) => boolean = () => true
): PlainObject[] {
    const templates: PlainObject[] = [];
    for (const entry of moduleRegistry.optionsContributions()) {
        const { contribution } = entry;
        if (entry.host !== host || contribution.themeTemplate == null || !applies(contribution)) continue;
        templates.push(nestAtOptionsPath(entry.relative, contribution.themeTemplate));
    }
    return templates;
}

function getAxisThemeTemplate(axisType: string, moduleRegistry: ModuleScope) {
    return mergeDefaultsShallowOperations(
        ...contributedThemeTemplates(moduleRegistry, 'axis', (c) => contributionMatchesAxisType(c, axisType)),
        moduleRegistry.getAxisModule(axisType)?.themeTemplate ?? {}
    );
}

function getSeriesThemeTemplate(seriesType: string, moduleRegistry: ModuleScope) {
    const seriesTemplates = contributedThemeTemplates(moduleRegistry, 'series', (c) =>
        contributionMatchesSeriesType(c, seriesType)
    );
    return mergeDefaultsShallowOperations(
        ...seriesTemplates.map((template) => ({ series: template })),
        moduleRegistry.getSeriesModule(seriesType)?.themeTemplate ?? {}
    );
}
