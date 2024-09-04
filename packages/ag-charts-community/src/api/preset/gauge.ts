import type {
    AgBasePresetOptions,
    AgCartesianAxisOptions,
    AgCartesianAxisPosition,
    AgGaugeChartOptions,
    AgGaugeOptions,
    AgLinearGaugeOptions,
    AgLinearGaugeSeriesOptions,
    AgPolarAxisOptions,
    AgRadialGaugeOptions,
    AgRadialGaugeSeriesOptions,
} from 'ag-charts-types';

function isRadialGauge(opts: AgGaugeOptions): opts is AgRadialGaugeSeriesOptions {
    return opts.type === 'radial-gauge';
}

function isLinearGauge(opts: AgGaugeOptions): opts is AgLinearGaugeOptions {
    return opts.type === 'linear-gauge';
}

function allProperties<T>(
    opts: AgGaugeOptions,
    typeCheckedOpts: Record<keyof T, boolean>,
    overrides?: Record<string, any>
): T {
    const out: any = {};
    for (const key in typeCheckedOpts) {
        if (typeCheckedOpts[key] && Object.hasOwn(opts, key)) {
            out[key] = (opts as any)[key];
        }
    }

    if (overrides != null) {
        for (const key in overrides) {
            const value = overrides[key];
            if (value != null) {
                out[key] = value;
            }
        }
    }

    return out;
}

function radialGaugeOptions(opts: AgRadialGaugeOptions) {
    const seriesOpts = allProperties<AgRadialGaugeSeriesOptions>(
        opts,
        {
            type: true,
            id: true,
            data: true,
            visible: true,
            cursor: true,
            nodeClickRange: true,
            showInLegend: true,
            listeners: true,
            tooltip: true,
            value: true,
            scale: false,
            startAngle: false,
            endAngle: false,
            itemStyler: true,
            highlightStyle: true,
            bar: true,
            background: true,
            needle: true,
            targets: true,
            target: true,
            outerRadiusRatio: true,
            innerRadiusRatio: true,
            sectorSpacing: true,
            cornerRadius: true,
            appearance: true,
            cornerMode: true,
            label: true,
            secondaryLabel: true,
            margin: true,
        },
        {
            colorStops: opts.scale?.fills,
        }
    );

    const { values, step, ...label } = opts.scale?.label ?? {};
    const axesOpts: AgPolarAxisOptions[] = [
        {
            type: 'angle-number',
            min: opts.scale?.min ?? 0,
            max: opts.scale?.max ?? 1,
            startAngle: opts.startAngle ?? 270,
            endAngle: opts.endAngle ?? 270 + 180,
            interval: {
                values,
                step,
            },
            label,
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
        series: [seriesOpts],
        axes: axesOpts,
    };
}

function linearGaugeOptions(opts: AgLinearGaugeSeriesOptions) {
    const seriesOpts = allProperties<AgLinearGaugeSeriesOptions>(
        opts,
        {
            type: true,
            id: true,
            data: true,
            visible: true,
            cursor: true,
            nodeClickRange: true,
            showInLegend: true,
            listeners: true,
            tooltip: true,
            value: true,
            scale: false,
            horizontal: true,
            thickness: true,
            itemStyler: true,
            highlightStyle: true,
            bar: true,
            background: true,
            targets: true,
            target: true,
            barSpacing: true,
            cornerRadius: true,
            appearance: true,
            cornerMode: true,
            label: true,
            secondaryLabel: true,
            margin: true,
        },
        {
            colorStops: opts.scale?.fills,
        }
    );

    const { horizontal = false } = opts;
    const { values, step, placement, ...label } = opts.scale?.label ?? {};
    let mainAxisPosition: AgCartesianAxisPosition;
    let crossAxisPosition: AgCartesianAxisPosition;
    if (horizontal) {
        mainAxisPosition = placement === 'before' ? 'top' : 'bottom';
        crossAxisPosition = 'left';
    } else {
        mainAxisPosition = placement === 'after' ? 'right' : 'left';
        crossAxisPosition = 'bottom';
    }
    const mainAxis: AgCartesianAxisOptions = {
        type: 'number',
        position: mainAxisPosition,
        min: opts.scale?.min ?? 0,
        max: opts.scale?.max ?? 1,
        reverse: !horizontal,
        interval: {
            values,
            step,
        },
        label,
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
        series: [seriesOpts],
        axes: axesOpts,
    };
}

export function gauge(opts: AgGaugeOptions): AgGaugeChartOptions {
    const baseOpts = allProperties<AgBasePresetOptions>(opts, {
        container: true,
        animation: true,
        width: true,
        height: true,
        minWidth: true,
        minHeight: true,
        theme: true,
        title: true,
        seriesArea: true,
        listeners: true,
    });

    if (isRadialGauge(opts)) {
        return {
            ...baseOpts,
            ...radialGaugeOptions(opts),
        };
    } else if (isLinearGauge(opts)) {
        return {
            ...baseOpts,
            ...linearGaugeOptions(opts),
        };
    }

    return baseOpts;
}
