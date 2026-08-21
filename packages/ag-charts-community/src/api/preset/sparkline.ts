import { isDate, isNumber, isString, simpleMemorize, toTextString } from 'ag-charts-core';
import type {
    AgAreaSeriesOptions,
    AgAreaSeriesTooltipRendererParams,
    AgAxisGridLineOptions,
    AgBarSeriesOptions,
    AgBarSeriesTooltipRendererParams,
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgLineSeriesOptions,
    AgLineSeriesTooltipRendererParams,
    AgSparklineAxisOptions,
    AgSparklineCategoryAxisOptions,
    AgSparklineOptions,
    AgSparklineTooltip,
    AgTooltipRendererResult,
} from 'ag-charts-types';

interface SparklineUndocumentedProperties {
    overrideDevicePixelRatio?: number;
    foreground?: object;
}

type SparklineSeries = AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions;

export function sparklineDataPreset(data: any[] | undefined): {
    data: any[] | undefined;
    series?: { xKey: string; yKey: string }[];
    datumKey?: string;
} {
    if (Array.isArray(data) && data.length !== 0) {
        const firstItem = data.find((v) => v != null);
        if (typeof firstItem === 'number') {
            const mappedData = data.map((y, x) => ({ x, y }));
            return { data: mappedData, series: [{ xKey: 'x', yKey: 'y' }], datumKey: 'y' };
        } else if (Array.isArray(firstItem)) {
            const mappedData = data.map((datum) => ({ x: datum?.[0], y: datum?.[1], datum }));
            return { data: mappedData, series: [{ xKey: 'x', yKey: 'y' }], datumKey: 'datum' };
        }
    } else if (data?.length === 0) {
        return { data, series: [{ xKey: 'x', yKey: 'y' }], datumKey: 'y' };
    }
    return { data };
}

function axisPreset(opts: AgSparklineAxisOptions | undefined): AgCartesianAxisOptions {
    switch (opts?.type) {
        case 'number': {
            const { reverse, min, max } = opts ?? {};
            return {
                type: 'number',
                reverse,
                min,
                max,
            };
        }
        case 'time': {
            const { reverse, min, max } = opts ?? {};
            return {
                type: 'time',
                reverse,
                min,
                max,
            };
        }
        case 'category':
        default: {
            if (opts == null) {
                return { type: 'category' };
            }
            const { reverse, paddingInner, paddingOuter } = opts as AgSparklineCategoryAxisOptions;
            return {
                type: 'category',
                reverse,
                paddingInner,
                paddingOuter,
            };
        }
    }
}

function gridLinePreset(
    opts: AgSparklineAxisOptions | undefined,
    defaultEnabled: boolean,
    sparkOpts: AgSparklineOptions
): AgAxisGridLineOptions {
    const gridLineOpts: AgAxisGridLineOptions = {};

    if (opts?.stroke != null) {
        gridLineOpts.style = [{ stroke: opts?.stroke }];
        gridLineOpts.enabled ??= true;
    }
    if (opts?.strokeWidth != null) {
        gridLineOpts.width = opts?.strokeWidth;
        gridLineOpts.enabled ??= true;
    }
    if (sparkOpts.type === 'bar' && sparkOpts.direction !== 'horizontal') {
        gridLineOpts.enabled ??= true;
    }
    if (opts?.visible != null) {
        gridLineOpts.enabled = opts.visible;
    }
    gridLineOpts.enabled ??= defaultEnabled;
    return gridLineOpts;
}

// The x value is prepended to the default content only when it is both meaningful and has somewhere to
// go, matching the Grid's sparkline default tooltip (which also renders y raw, without `.toFixed(2)`).
const defaultTooltipContent = (
    xValue: unknown,
    yValue: unknown,
    datumKey: string | undefined,
    hasUserTitle: boolean
): string => {
    const showXValue = !hasUserTitle && datumKey !== 'y' && xValue != null;
    return showXValue ? `${String(xValue)} ${String(yValue)}` : String(yValue);
};

const tooltipRendererFn = simpleMemorize((tooltip?: AgSparklineTooltip<any>, datumKey?: string) => {
    return (
        params: AgBarSeriesTooltipRendererParams | AgLineSeriesTooltipRendererParams | AgAreaSeriesTooltipRendererParams
    ): AgTooltipRendererResult | string => {
        const xValue = params.datum[params.xKey];
        const yValue = params.datum[params.yKey];
        const datum = datumKey == null ? params.datum : params.datum[datumKey];

        // Read `context` from params (set per-chart by `callWithContext`) rather than
        // capturing it at wrap time, so the structural cache can share this wrapper.
        const userContent = tooltip?.renderer?.({ context: params.context, datum, xValue, yValue });

        if (isString(userContent) || isNumber(userContent) || isDate(userContent)) {
            return toTextString(userContent);
        }

        // Absent renderer or one returning `undefined` falls through to the default content.
        const hasUserTitle = userContent?.title != null;
        const content = userContent?.content ?? defaultTooltipContent(xValue, yValue, datumKey, hasUserTitle);

        return userContent?.title
            ? {
                  heading: undefined,
                  title: undefined,
                  data: [{ label: userContent.title, value: content }],
              }
            : {
                  heading: undefined,
                  title: content,
                  data: [],
              };
    };
});

export function sparkline(opts: AgSparklineOptions): AgCartesianChartOptions {
    const {
        background,
        container,
        foreground,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        overrideDevicePixelRatio,
        padding,
        width,
        // Resolved from the chart's own options against the preset's `themeTemplate`; pulled out
        // here only to keep it out of the series config below.
        theme: _theme,
        data: baseData,
        crosshair,
        axis,
        min,
        max,
        tooltip,
        context,
        styleNonce,
        ...seriesOptions
    } = opts as AgSparklineOptions & SparklineUndocumentedProperties;

    const chartOpts: AgCartesianChartOptions & SparklineUndocumentedProperties = {
        background,
        container,
        context,
        foreground,
        height,
        listeners: listeners as AgCartesianChartOptions['listeners'],
        locale,
        minHeight,
        minWidth,
        overrideDevicePixelRatio,
        padding,
        width,
        styleNonce,
    };

    const { data, series: [seriesOverrides] = [], datumKey } = sparklineDataPreset(baseData);

    const seriesConfig = seriesOptions as SparklineSeries;
    if (seriesOverrides != null) {
        Object.assign(seriesConfig, seriesOverrides);
    }
    seriesConfig.tooltip = {
        ...tooltip,
        renderer: tooltipRendererFn(tooltip, datumKey),
    };

    chartOpts.data = data;
    chartOpts.series = [seriesConfig];

    const swapAxes = seriesConfig.type === 'bar' && seriesConfig.direction === 'horizontal';
    const [crossAxisPosition, numberAxisPosition] = swapAxes
        ? (['left', 'bottom'] as const)
        : (['bottom', 'left'] as const);

    const crossAxis: AgCartesianAxisOptions = {
        ...axisPreset(axis),
        position: crossAxisPosition,
        ...(crosshair == null ? {} : { crosshair }),
    };
    const numberAxis: AgCartesianAxisOptions = {
        type: 'number',
        gridLine: gridLinePreset(axis, false, opts),
        position: numberAxisPosition,
        ...(min == null ? {} : { min }),
        ...(max == null ? {} : { max }),
    };

    chartOpts.axes = swapAxes ? { x: numberAxis, y: crossAxis } : { x: crossAxis, y: numberAxis };

    return chartOpts;
}
