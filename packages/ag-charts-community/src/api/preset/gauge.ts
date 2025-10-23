import {
    type AgBaseGaugePresetOptions,
    type AgChartTooltipOptions,
    type AgGaugeChartOptions,
    type AgGaugeOptions,
    type AgLinearGaugeOptions,
    type AgLinearGaugePreset,
    type AgLinearGaugeThemeOverrides,
    type AgRadialGaugeOptions,
    type AgRadialGaugePreset,
    type AgRadialGaugeThemeOverrides,
    type AgSeriesTooltip,
} from 'ag-charts-types';

import { mergeArrayDefaults, mergeDefaults } from '../../util/object';
import { IGNORED_PROP, pickProps } from './presetUtils';

interface UndocumentedProperties {
    overrideDevicePixelRatio?: number;
}

function tooltipOptions(opts: Exclude<AgRadialGaugeOptions['tooltip'], undefined>) {
    const { enabled, mode, showArrow, range, position, pagination, delay, wrapping, interaction, renderer, ...rest } =
        opts;

    const seriesTooltipOptions: AgSeriesTooltip<any> = pickProps<AgSeriesTooltip<any>>(opts, {
        enabled,
        showArrow,
        range,
        position,
        interaction,
        renderer,
        ...rest,
    });

    const chartTooltipOptions: AgChartTooltipOptions = pickProps<AgChartTooltipOptions>(opts, {
        enabled: IGNORED_PROP,
        showArrow: IGNORED_PROP,
        range: IGNORED_PROP,
        position: IGNORED_PROP,
        mode,
        pagination,
        delay,
        wrapping,
        ...rest,
    });

    return { chartTooltipOptions, seriesTooltipOptions };
}

function radialGaugeOptions(opts: AgRadialGaugeOptions) {
    const {
        animation,
        background,
        container,
        contextMenu,
        context,
        footnote,
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
        tooltip = {},
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
        ...rest
    } = opts as AgRadialGaugeOptions & UndocumentedProperties;

    const { chartTooltipOptions, seriesTooltipOptions } = tooltipOptions(tooltip);

    const chartOpts = pickProps<AgBaseGaugePresetOptions & UndocumentedProperties>(opts, {
        animation,
        background,
        container,
        contextMenu,
        context,
        footnote,
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
        tooltip: chartTooltipOptions,
        width,
    });

    const seriesOpts = pickProps<AgRadialGaugePreset>(opts, {
        needle: needle == null ? IGNORED_PROP : { enabled: true, ...needle },
        startAngle,
        endAngle,
        scale,
        type,
        cursor,
        context,
        nodeClickRange,
        tooltip: seriesTooltipOptions,
        value,
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
        ...rest,
    });

    return {
        ...chartOpts,
        series: [seriesOpts],
    };
}

function linearGaugeOptions(opts: AgLinearGaugeOptions): AgGaugeChartOptions {
    const {
        animation,
        background,
        container,
        contextMenu,
        context,
        footnote,
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
        tooltip = {},
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
        ...rest
    } = opts as AgLinearGaugeOptions & UndocumentedProperties;

    const { chartTooltipOptions, seriesTooltipOptions } = tooltipOptions(tooltip);

    const chartOpts = pickProps<AgBaseGaugePresetOptions & UndocumentedProperties>(opts, {
        animation,
        background,
        container,
        contextMenu,
        context,
        footnote,
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
        tooltip: chartTooltipOptions,
        width,
    });
    const seriesOpts = pickProps<AgLinearGaugePreset>(opts, {
        scale,
        type,
        cursor,
        context,
        nodeClickRange,
        tooltip: seriesTooltipOptions,
        value,
        direction,
        thickness,
        highlight,
        segmentation,
        bar,
        targets,
        cornerRadius,
        cornerMode,
        label,
        ...rest,
    });

    return {
        ...chartOpts,
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
        opts.targets = mergeArrayDefaults(opts.targets, targetsTheme) as any[];
    }

    return opts;
}

export function gauge(
    opts: AgGaugeOptions,
    presetTheme: AgRadialGaugeThemeOverrides | AgLinearGaugeThemeOverrides | undefined
): AgGaugeChartOptions {
    switch (opts.type) {
        case 'radial-gauge':
            return radialGaugeOptions(applyThemeDefaults(opts, presetTheme as any));

        case 'linear-gauge':
            return linearGaugeOptions(applyThemeDefaults(opts, presetTheme as any));

        default:
            return {};
    }
}
