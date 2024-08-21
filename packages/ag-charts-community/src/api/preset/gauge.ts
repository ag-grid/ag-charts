import type {
    AgBasePresetOptions,
    AgGaugeChartOptions,
    AgGaugeOptions,
    AgRadialGaugeSeriesOptions,
} from 'ag-charts-types';

import type { RequireOptional } from '../../util/types';

function allProperties<T>(opts: AgGaugeOptions, typeCheckedOpts: RequireOptional<T>): T {
    const out: T = {} as any;
    Object.keys(typeCheckedOpts).forEach((key) => {
        if (Object.hasOwn(opts, key)) {
            // @ts-expect-error
            out[key] = opts[key];
        }
    });
    return out;
}

export function gauge(opts: AgGaugeOptions): AgGaugeChartOptions {
    const baseOpts = allProperties<AgBasePresetOptions>(opts, {
        container: opts.container,
        animation: opts.animation,
        width: opts.width,
        height: opts.height,
        minWidth: opts.minWidth,
        minHeight: opts.minHeight,
        theme: opts.theme,
        title: opts.title,
    });
    const seriesOpts = allProperties<AgRadialGaugeSeriesOptions>(opts, {
        type: opts.type,
        id: opts.id,
        data: opts.data,
        visible: opts.visible,
        cursor: opts.cursor,
        nodeClickRange: opts.nodeClickRange,
        showInLegend: opts.showInLegend,
        listeners: opts.listeners,
        tooltip: opts.tooltip,
        value: opts.value,
        range: opts.range,
        itemStyler: opts.itemStyler,
        highlightStyle: opts.highlightStyle,
        foreground: opts.foreground,
        background: opts.background,
        needle: opts.needle,
        colorRange: opts.colorRange,
        colorStops: opts.colorStops,
        targets: opts.targets,
        outerRadiusRatio: opts.outerRadiusRatio,
        innerRadiusRatio: opts.innerRadiusRatio,
        startAngle: opts.startAngle,
        endAngle: opts.endAngle,
        sectorSpacing: opts.sectorSpacing,
        cornerRadius: opts.cornerRadius,
        itemMode: opts.itemMode,
        cornerMode: opts.cornerMode,
        label: opts.label,
        secondaryLabel: opts.secondaryLabel,
        padding: opts.padding,
    });
    return {
        ...baseOpts,
        series: [seriesOpts],
    };
}
