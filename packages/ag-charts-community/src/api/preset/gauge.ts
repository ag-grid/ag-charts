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
} from 'ag-charts-types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertEmpty(_t: Record<string, never>) {}

const IGNORED_PROP = Symbol('IGNORED_PROP');

function pickProps<T>(
    opts: Partial<T>,
    values: { [K in keyof Required<T>]: T[K] extends Required<T[K]> ? T[K] : T[K] | typeof IGNORED_PROP | undefined }
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
        seriesArea,
        listeners,
        type,
        id,
        data,
        visible,
        cursor,
        nodeClickRange,
        showInLegend,
        tooltip,
        value,
        scale,
        startAngle,
        endAngle,
        itemStyler,
        highlightStyle,
        bar,
        background,
        needle,
        targets,
        target,
        outerRadiusRatio,
        innerRadiusRatio,
        sectorSpacing,
        cornerRadius,
        appearance,
        cornerMode,
        label,
        secondaryLabel,
        margin,
        ...rest
    } = opts;
    assertEmpty(rest);

    const chartOpts = pickProps(opts, {
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
    const seriesOpts = pickProps<AgRadialGaugeSeriesOptions>(opts, {
        scale: IGNORED_PROP,
        type,
        id,
        data,
        visible,
        cursor,
        nodeClickRange,
        showInLegend,
        listeners,
        tooltip,
        value,
        startAngle,
        endAngle,
        itemStyler,
        highlightStyle,
        bar,
        background,
        needle,
        targets,
        target,
        outerRadiusRatio,
        innerRadiusRatio,
        sectorSpacing,
        cornerRadius,
        appearance,
        cornerMode,
        label,
        secondaryLabel,
        margin,
        ...rest,
    });

    const axesOpts: AgPolarAxisOptions[] = [
        {
            type: 'angle-number',
            min: scale?.min ?? 0,
            max: scale?.max ?? 1,
            startAngle: opts.startAngle ?? 270,
            endAngle: opts.endAngle ?? 270 + 180,
            interval: scale?.interval ?? {},
            label: scale?.label ?? {},
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
        seriesArea,
        listeners,
        type,
        id,
        data,
        visible,
        cursor,
        nodeClickRange,
        showInLegend,
        tooltip,
        value,
        scale,
        horizontal,
        thickness,
        itemStyler,
        highlightStyle,
        bar,
        background,
        targets,
        target,
        barSpacing,
        cornerRadius,
        appearance,
        cornerMode,
        label,
        secondaryLabel,
        margin,
        ...rest
    } = opts;
    assertEmpty(rest);

    const chartOpts = pickProps(opts, {
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
    const seriesOpts = pickProps<AgLinearGaugeSeriesOptions>(opts, {
        scale: IGNORED_PROP,
        type,
        id,
        data,
        visible,
        cursor,
        nodeClickRange,
        showInLegend,
        listeners,
        tooltip,
        value,
        horizontal,
        thickness,
        itemStyler,
        highlightStyle,
        bar,
        background,
        targets,
        target,
        barSpacing,
        cornerRadius,
        appearance,
        cornerMode,
        label,
        secondaryLabel,
        margin,
        ...rest,
    });

    const { placement: labelPlacement, ...axisLabel } = scale?.label ?? {};
    let mainAxisPosition: AgCartesianAxisPosition;
    let crossAxisPosition: AgCartesianAxisPosition;
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
        min: opts.scale?.min ?? 0,
        max: opts.scale?.max ?? 1,
        reverse: !horizontal,
        interval: opts.scale?.interval ?? {},
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
    const chartOpts = pickProps(opts, {
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
    return chartOpts;
}
