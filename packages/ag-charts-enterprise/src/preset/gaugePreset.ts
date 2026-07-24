import { mergeArrayDefaults, mergeDefaults } from 'ag-charts-core';
import {
    type AgChartTooltipOptions,
    type AgGaugeChartOptions,
    type AgGaugeOptions,
    type AgLinearGaugeOptions,
    type AgLinearGaugePreset,
    type AgLinearGaugeTarget,
    type AgLinearGaugeThemeOverrides,
    type AgRadialGaugeOptions,
    type AgRadialGaugePreset,
    type AgRadialGaugeTarget,
    type AgRadialGaugeThemeOverrides,
    type AgSeriesTooltip,
} from 'ag-charts-types';

interface UndocumentedProperties {
    overrideDevicePixelRatio?: number;
    foreground?: object;
    withinStudio?: boolean;
}

type GaugeTooltip = Exclude<AgGaugeOptions['tooltip'], undefined>;
type GaugeSeries = AgLinearGaugePreset | AgRadialGaugePreset;
type GaugeChartResult = AgGaugeChartOptions & UndocumentedProperties & { series: GaugeSeries[] };

function tooltipOptions(opts: GaugeTooltip) {
    const { enabled, mode, showArrow, range, position, pagination, delay, wrapping, interaction, renderer, ...rest } =
        opts;

    const seriesTooltipOptions: AgSeriesTooltip<any> = {
        enabled,
        showArrow,
        range,
        position,
        interaction,
        renderer,
        ...rest,
    };

    const chartTooltipOptions: AgChartTooltipOptions = {
        mode,
        pagination,
        delay,
        wrapping,
        ...rest,
    };

    return { chartTooltipOptions, seriesTooltipOptions };
}

function radialGaugeOptions(opts: AgRadialGaugeOptions): GaugeChartResult {
    const {
        animation,
        background,
        container,
        contextMenu,
        context,
        footnote,
        foreground,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        overrideDevicePixelRatio,
        padding,
        subtitle,
        theme,
        title,
        width,
        type,
        cursor,
        nodeClickRange,
        tooltip: tooltipInput,
        value,
        scale = {},
        startAngle,
        endAngle,
        highlight,
        segmentation,
        bar,
        needle,
        targets,
        outerRadius,
        innerRadius,
        outerRadiusRatio,
        innerRadiusRatio,
        cornerRadius,
        cornerMode,
        label,
        secondaryLabel,
        spacing,

        withinStudio: _withinStudio, // unused within gauge itself
        ...seriesRest
    } = opts as AgRadialGaugeOptions & UndocumentedProperties;

    const hasTooltip = tooltipInput != null;
    const tooltip = tooltipInput ?? {};
    const { chartTooltipOptions, seriesTooltipOptions } = tooltipOptions(tooltip);

    const seriesOpts: AgRadialGaugePreset = {
        ...seriesRest,
        type,
        cursor,
        context,
        nodeClickRange,
        value,
        scale,
        startAngle,
        endAngle,
        highlight,
        segmentation,
        bar,
        targets,
        outerRadius,
        innerRadius,
        outerRadiusRatio,
        innerRadiusRatio,
        cornerRadius,
        cornerMode,
        label,
        secondaryLabel,
        spacing,
    };
    if (hasTooltip) {
        seriesOpts.tooltip = seriesTooltipOptions;
    }
    if (needle != null) {
        seriesOpts.needle = { enabled: true, ...needle };
    }

    return {
        animation,
        background,
        container,
        contextMenu,
        context,
        footnote,
        foreground,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        overrideDevicePixelRatio,
        padding,
        subtitle,
        theme,
        title,
        width,
        ...(hasTooltip ? { tooltip: chartTooltipOptions } : {}),
        series: [seriesOpts],
    };
}

function linearGaugeOptions(opts: AgLinearGaugeOptions): GaugeChartResult {
    const {
        animation,
        background,
        container,
        contextMenu,
        context,
        footnote,
        foreground,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        overrideDevicePixelRatio,
        padding,
        subtitle,
        theme,
        title,
        width,
        type,
        cursor,
        nodeClickRange,
        tooltip: tooltipInput,
        value,
        scale = {},
        direction = 'vertical',
        thickness,
        highlight,
        segmentation,
        bar,
        targets,
        cornerRadius,
        cornerMode,
        label,

        withinStudio: _withinStudio, // unused within gauge itself
        ...seriesRest
    } = opts as AgLinearGaugeOptions & UndocumentedProperties;

    const hasTooltip = tooltipInput != null;
    const tooltip = tooltipInput ?? {};
    const { chartTooltipOptions, seriesTooltipOptions } = tooltipOptions(tooltip);

    const seriesOpts: AgLinearGaugePreset = {
        ...seriesRest,
        type,
        cursor,
        nodeClickRange,
        value,
        scale,
        direction,
        thickness,
        highlight,
        segmentation,
        bar,
        targets,
        cornerRadius,
        cornerMode,
        label,
    };
    if (hasTooltip) {
        seriesOpts.tooltip = seriesTooltipOptions;
    }

    return {
        animation,
        background,
        container,
        contextMenu,
        context,
        footnote,
        foreground,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        overrideDevicePixelRatio,
        padding,
        subtitle,
        theme,
        title,
        width,
        ...(hasTooltip ? { tooltip: chartTooltipOptions } : {}),
        series: [seriesOpts],
    };
}

function applyThemeDefaults(
    opts: AgRadialGaugeOptions,
    presetTheme: AgRadialGaugeThemeOverrides | undefined
): AgRadialGaugeOptions;
function applyThemeDefaults(
    opts: AgLinearGaugeOptions,
    presetTheme: AgLinearGaugeThemeOverrides | undefined
): AgLinearGaugeOptions;
function applyThemeDefaults(
    opts: AgGaugeOptions,
    presetTheme: AgRadialGaugeThemeOverrides | AgLinearGaugeThemeOverrides | undefined
): AgGaugeOptions {
    if (presetTheme == null) return opts;

    const { targets: targetsTheme, ...gaugeTheme } = presetTheme;
    opts = mergeDefaults(opts, gaugeTheme);

    if (opts.targets != null && targetsTheme != null) {
        if (opts.type === 'radial-gauge') {
            opts.targets = mergeArrayDefaults(opts.targets, targetsTheme as AgRadialGaugeTarget);
        } else {
            opts.targets = mergeArrayDefaults(opts.targets, targetsTheme as AgLinearGaugeTarget);
        }
    }

    return opts;
}

// Root-level keys a gauge maps onto its single series (see `radialGaugeOptions`/`linearGaugeOptions`),
// and which therefore only need re-merging onto that series on a streaming update — no preset reprocess.
export const GAUGE_FAST_UPDATE_KEYS: ReadonlySet<string> = new Set(['value', 'targets']);

export function gaugeFastUpdate(delta: Record<string, unknown>): Record<string, unknown> {
    const result = { ...delta };
    const series: Record<string, unknown> = {};
    for (const key of GAUGE_FAST_UPDATE_KEYS) {
        if (key in result) {
            series[key] = result[key];
            delete result[key];
        }
    }
    if (Object.keys(series).length > 0) {
        result.series = [series];
    }
    return result;
}

export function createGauge(
    opts: AgGaugeOptions,
    presetTheme: AgRadialGaugeThemeOverrides | AgLinearGaugeThemeOverrides | undefined
): GaugeChartResult {
    switch (opts.type) {
        case 'radial-gauge':
            return radialGaugeOptions(applyThemeDefaults(opts, presetTheme as AgRadialGaugeThemeOverrides | undefined));

        case 'linear-gauge':
            return linearGaugeOptions(applyThemeDefaults(opts, presetTheme as AgLinearGaugeThemeOverrides | undefined));

        default:
            return { series: [] };
    }
}
