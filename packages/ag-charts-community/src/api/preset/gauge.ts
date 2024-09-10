import {
    type AgCartesianAxisOptions,
    type AgCartesianAxisPosition,
    type AgGaugeChartOptions,
    type AgGaugeOptions,
    type AgLinearGaugeOptions,
    type AgLinearGaugeSeriesOptions,
    type AgPolarAxisOptions,
    type AgRadialGaugeOptions,
    type AgRadialGaugeSeriesOptions,
    type AgRadialGaugeSeriesScale,
} from 'ag-charts-types';

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
    AgRadialGaugeSeriesScale,
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
        container,
        animation,
        width,
        height,
        minWidth,
        minHeight,
        theme,
        title,
        subtitle,
        padding,
        listeners,
        type,
        cursor,
        nodeClickRange,
        tooltip,
        value,
        scale = {},
        startAngle,
        endAngle,
        itemStyler,
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
        margin,
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

    const chartOpts = pickProps(opts, {
        container,
        animation,
        width,
        height,
        minWidth,
        minHeight,
        title,
        theme,
        subtitle,
        padding,
        listeners,
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
    const seriesOpts = pickProps<AgRadialGaugeSeriesOptions>(opts, {
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
        itemStyler,
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
        margin,
        ...rest,
    });

    const axesOpts: AgPolarAxisOptions[] = [
        {
            type: 'angle-number',
            min: scaleMin ?? 0,
            max: scaleMax ?? 1,
            startAngle: startAngle ?? 270,
            endAngle: endAngle ?? 270 + 180,
            interval: scaleInterval ?? {},
            label: scaleLabel ?? {},
            nice: false,
            line: {
                enabled: false,
            },
        },
        {
            type: 'radius-number',
        },
    ];

    return {
        ...chartOpts,
        series: [seriesOpts],
        axes: axesOpts,
    };
}

function linearGaugeOptions(opts: AgLinearGaugeOptions): AgGaugeChartOptions {
    const {
        container,
        animation,
        width,
        height,
        minWidth,
        minHeight,
        theme,
        title,
        subtitle,
        padding,
        listeners,
        type,
        cursor,
        nodeClickRange,
        tooltip,
        value,
        scale = {},
        direction,
        thickness,
        itemStyler,
        highlightStyle,
        segmentation,
        bar,
        background,
        targets,
        target,
        cornerRadius,
        cornerMode,
        label,
        secondaryLabel,
        margin,
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

    const chartOpts = pickProps(opts, {
        container,
        animation,
        width,
        height,
        minWidth,
        minHeight,
        theme,
        title,
        subtitle,
        padding,
        listeners,
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
    const seriesOpts = pickProps<AgLinearGaugeSeriesOptions>(opts, {
        scale: scaleOpts,
        type,
        cursor,
        nodeClickRange,
        listeners,
        tooltip,
        value,
        direction,
        thickness,
        itemStyler,
        highlightStyle,
        segmentation,
        bar,
        background,
        targets,
        target,
        cornerRadius,
        cornerMode,
        label,
        secondaryLabel,
        margin,
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
        line: {
            enabled: false,
        },
        gridLine: {
            enabled: false,
        },
    };
    const crossAxis: AgCartesianAxisOptions = {
        type: 'number',
        position: crossAxisPosition,
        min: 0,
        max: 1,
        line: {
            enabled: false,
        },
        label: {
            enabled: false,
        },
        gridLine: {
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

export function gauge(opts: AgGaugeOptions): AgGaugeChartOptions {
    if (isRadialGauge(opts)) {
        return radialGaugeOptions(opts);
    } else if (isLinearGauge(opts)) {
        return linearGaugeOptions(opts);
    }

    const { container, animation, width, height, minWidth, minHeight, theme, title, seriesArea, listeners } = opts;
    return pickProps(opts, {
        container,
        animation,
        width,
        height,
        minWidth,
        minHeight,
        theme,
        title,
        seriesArea,
        listeners,
    });
}
