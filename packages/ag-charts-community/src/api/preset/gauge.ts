import type {
    AgBasePresetOptions,
    AgGaugeChartOptions,
    AgGaugeOptions,
    AgPolarAxisOptions,
    AgRadialGaugeSeriesOptions,
} from 'ag-charts-types';

function allProperties<T extends {}>(
    opts: AgGaugeOptions,
    typeCheckedOpts: Record<keyof T, boolean>,
    overrides?: Record<string, any>
): T {
    const out: T = {} as any;
    for (const key in typeCheckedOpts) {
        if (typeCheckedOpts[key] && Object.hasOwn(opts, key)) {
            // @ts-expect-error
            out[key] = opts[key];
        }
    }

    if (overrides != null) {
        for (const key in overrides) {
            const value = overrides[key];
            if (value != null) {
                // @ts-expect-error
                out[key] = value;
            }
        }
    }

    return out;
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
    });

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
        ...baseOpts,
        series: [seriesOpts],
        axes: axesOpts,
    };
}
