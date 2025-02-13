import type { RequireOptional } from 'ag-charts-core';
import {
    type AgBaseGaugePresetOptions,
    type AgChartTooltipOptions,
    type AgGaugeChartOptions,
    type AgGaugeOptions,
    type AgLinearGaugeOptions,
    type AgLinearGaugePreset,
    type AgLinearGaugeThemeOverrides,
    type AgPolarAxisOptions,
    type AgRadialGaugeOptions,
    type AgRadialGaugePreset,
    type AgRadialGaugeScale,
    type AgRadialGaugeThemeOverrides,
} from 'ag-charts-types';

import { mergeArrayDefaults, mergeDefaults } from '../../util/object';
import { IGNORED_PROP, pickProps } from './presetUtils';

function pickTooltipProps(tooltip: AgChartTooltipOptions | undefined): AgChartTooltipOptions | undefined {
    if (tooltip === undefined) return undefined;

    const { enabled, showArrow, range, position, delay, wrapping } = tooltip;
    const result: RequireOptional<AgChartTooltipOptions> = {
        enabled,
        showArrow,
        range,
        position,
        delay,
        wrapping,
    };
    // eslint-disable-next-line no-restricted-properties
    return Object.fromEntries(Object.entries(result).filter(([_, value]) => value !== undefined));
}

function isRadialGauge(opts: AgGaugeOptions): opts is AgRadialGaugeOptions {
    return opts.type === 'radial-gauge';
}

function isLinearGauge(opts: AgGaugeOptions): opts is AgLinearGaugeOptions {
    return opts.type === 'linear-gauge';
}

type ScaleStyle = Pick<
    AgRadialGaugeScale,
    | 'fills'
    | 'fillMode'
    | 'fill'
    | 'fillOpacity'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset'
>;

interface UndocumentedProperties {
    overrideDevicePixelRatio?: number;
}

function radialGaugeOptions(opts: AgRadialGaugeOptions) {
    const {
        animation,
        background,
        container,
        contextMenu,
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
        tooltip,
        value,
        scale = {},
        startAngle,
        endAngle,
        highlightStyle,
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

    const {
        fills: scaleFills,
        fillMode: scaleFillMode,
        fill: scaleFill,
        fillOpacity: scaleFillOpacity,
        stroke: scaleStroke,
        strokeWidth: scaleStrokeWidth,
        strokeOpacity: scaleStrokeOpacity,
        lineDash: scaleLineDash,
        lineDashOffset: scaleLineDashOffset,
        min: scaleMin = 0,
        max: scaleMax = 1,
        interval: scaleInterval = {},
        label: scaleLabel = {},
    } = scale;

    const chartOpts = pickProps<AgBaseGaugePresetOptions & UndocumentedProperties>(opts, {
        animation,
        background,
        container,
        contextMenu,
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
        tooltip: pickTooltipProps(tooltip),
        width,
    });

    const scaleOpts = pickProps<ScaleStyle>(scale, {
        fills: scaleFills,
        fillMode: scaleFillMode,
        fill: scaleFill,
        fillOpacity: scaleFillOpacity,
        stroke: scaleStroke,
        strokeWidth: scaleStrokeWidth,
        strokeOpacity: scaleStrokeOpacity,
        lineDash: scaleLineDash,
        lineDashOffset: scaleLineDashOffset,
    });
    const seriesOpts = pickProps<AgRadialGaugePreset>(opts, {
        startAngle: IGNORED_PROP,
        endAngle: IGNORED_PROP,
        needle: needle != null ? { enabled: true, ...needle } : IGNORED_PROP,
        scale: scaleOpts,
        type,
        cursor,
        nodeClickRange,
        listeners,
        tooltip,
        value,
        highlightStyle,
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

    const axesOpts: AgPolarAxisOptions[] = [
        {
            type: 'angle-number',
            min: scaleMin,
            max: scaleMax,
            startAngle: startAngle,
            endAngle: endAngle,
            interval: scaleInterval ?? {},
            label: scaleLabel ?? {},
        },
        { type: 'radius-number' },
    ];

    return {
        ...chartOpts,
        series: [seriesOpts],
        axes: axesOpts,
    };
}

function linearGaugeOptions(opts: AgLinearGaugeOptions): AgGaugeChartOptions {
    const {
        animation,
        background,
        container,
        contextMenu,
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
        tooltip,
        value,
        scale = {},
        direction = 'vertical',
        thickness,
        highlightStyle,
        segmentation,
        bar,
        targets,
        cornerRadius,
        cornerMode,
        label,
        ...rest
    } = opts as AgLinearGaugeOptions & UndocumentedProperties;

    const chartOpts = pickProps<AgBaseGaugePresetOptions & UndocumentedProperties>(opts, {
        animation,
        background,
        container,
        contextMenu,
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
        tooltip: pickTooltipProps(tooltip),
        width,
    });
    const seriesOpts = pickProps<AgLinearGaugePreset>(opts, {
        scale,
        type,
        cursor,
        nodeClickRange,
        listeners,
        tooltip,
        value,
        direction,
        thickness,
        highlightStyle,
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
    if (isRadialGauge(opts)) {
        const radialGaugeOpts = applyThemeDefaults(opts, presetTheme as any);
        return radialGaugeOptions(radialGaugeOpts);
    } else if (isLinearGauge(opts)) {
        const linearGaugeOpts = applyThemeDefaults(opts, presetTheme as any);
        return linearGaugeOptions(linearGaugeOpts);
    }

    const {
        animation,
        background,
        container,
        contextMenu,
        footnote,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        padding,
        subtitle,
        theme,
        title,
        tooltip,
        width,
    } = opts;
    return pickProps<AgBaseGaugePresetOptions>(opts, {
        animation,
        background,
        container,
        contextMenu,
        footnote,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        padding,
        subtitle,
        theme,
        title,
        tooltip,
        width,
    });
}
