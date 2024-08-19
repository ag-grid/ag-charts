import type {
    AgBasePresetOptions,
    AgGaugeChartOptions,
    AgGaugeChartOptions2,
    AgRadialGaugeSeriesOptions,
} from 'ag-charts-types';

import type { RequireOptional } from '../../util/types';

function allProperties<T>(opts: AgGaugeChartOptions2, v: RequireOptional<T>): T {
    Object.keys(v).forEach((key) => {
        if (!Object.hasOwn(opts, key)) {
            // @ts-expect-error
            delete v[key];
        }
    });
    return v as any;
}

export function gauge(opts: AgGaugeChartOptions2): AgGaugeChartOptions {
    const baseOpts = allProperties<AgBasePresetOptions>(opts, {
        container: opts.container,
        data: opts.data,
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
        value: opts.value,
        range: opts.range,
        colorRange: opts.colorRange,
        label: opts.label,
        secondaryLabel: opts.secondaryLabel,
        padding: opts.padding,
        tooltip: opts.tooltip,
        itemStyler: opts.itemStyler,
        highlightStyle: opts.highlightStyle,
        fill: opts.fill,
        fillOpacity: opts.fillOpacity,
        stroke: opts.stroke,
        strokeWidth: opts.strokeWidth,
        strokeOpacity: opts.strokeOpacity,
        lineDash: opts.lineDash,
        lineDashOffset: opts.lineDashOffset,
    });
    return {
        ...baseOpts,
        series: [seriesOpts],
    };
}
