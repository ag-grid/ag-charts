import {
    type AgBaseGaugePresetOptions,
    type AgCartesianAxisOptions,
    type AgCartesianAxisPosition,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertEmpty(_t: Record<string, never>) {}

const IGNORED_PROP = Symbol('IGNORED_PROP');

function pickProps<T>(
    opts: Partial<T>,
    values: { [K in keyof Required<T>]: (T[K] extends Required<T[K]> ? T[K] : T[K] | undefined) | typeof IGNORED_PROP }
) {
    const out: any = {};
    for (const key in values) {
        const value = values[key];
        if (value !== IGNORED_PROP && Object.hasOwn(opts as any, key)) {
            out[key] = value;
        }
    }
    return out;
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
    } = opts;
    assertEmpty(rest);

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
        ...scaleRest
    } = scale;
    assertEmpty(scaleRest);

    const chartOpts = pickProps<AgBaseGaugePresetOptions>(opts, {
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
        target,
        cornerRadius,
        cornerMode,
        label,
        ...rest
    } = opts;
    assertEmpty(rest);

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
        ...scaleRest
    } = scale;
    assertEmpty(scaleRest);

    const chartOpts = pickProps<AgBaseGaugePresetOptions>(opts, {
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
    const seriesOpts = pickProps<AgLinearGaugePreset>(opts, {
        scale: scaleOpts,
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
        target,
        cornerRadius,
        cornerMode,
        label,
        ...rest,
    });

    const { placement: labelPlacement, ...axisLabel } = scaleLabel;
    let mainAxisPosition: AgCartesianAxisPosition;
    let crossAxisPosition: AgCartesianAxisPosition;
    const horizontal = direction === 'horizontal';
    if (horizontal) {
        mainAxisPosition = labelPlacement === 'before' ? 'top' : 'bottom';
        crossAxisPosition = 'left';
    } else {
        mainAxisPosition = labelPlacement === 'after' ? 'right' : 'left';
        crossAxisPosition = 'bottom';
    }
    const mainAxis: AgCartesianAxisOptions = {
        type: 'number',
        position: mainAxisPosition,
        min: scaleMin,
        max: scaleMax,
        reverse: !horizontal,
        interval: scaleInterval,
        label: axisLabel,
        nice: false,
    };
    const crossAxis: AgCartesianAxisOptions = {
        type: 'number',
        position: crossAxisPosition,
        min: 0,
        max: 1,
        label: {
            enabled: false,
        },
    };
    const axesOpts: AgCartesianAxisOptions[] = horizontal ? [mainAxis, crossAxis] : [crossAxis, mainAxis];

    return {
        ...chartOpts,
        series: [seriesOpts],
        axes: axesOpts,
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
        width,
    });
}
