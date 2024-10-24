import {
    type AgAxisGridLineOptions,
    type AgBaseSparklinePresetOptions,
    type AgCartesianAxisOptions,
    type AgCartesianChartOptions,
    type AgCartesianSeriesOptions,
    type AgCategoryAxisOptions,
    type AgChartTheme,
    type AgChartThemeName,
    type AgLogAxisOptions,
    type AgNumberAxisOptions,
    type AgOrdinalTimeAxisOptions,
    type AgSparklineAxisOptions,
    type AgSparklineOptions,
    type AgTimeAxisOptions,
    type AgTooltipPositionType,
} from 'ag-charts-types';

import { IS_ENTERPRISE } from '../../chart/themes/symbols';
import { IGNORED_PROP, assertEmpty, pickProps } from './presetUtils';

const commonAxisProperties = {
    title: {
        enabled: false,
    },
    label: {
        enabled: false,
    },
    line: {
        enabled: false,
    },
    gridLine: {
        enabled: false,
    },
    crosshair: {
        enabled: false,
        strokeOpacity: 0.25,
        lineDash: [0],
        label: {
            enabled: false,
        },
    },
};

const numericAxisProperties = {
    ...commonAxisProperties,
    nice: false,
};

const bottomCrossHairAxisProperties = {
    bottom: {
        crosshair: {
            enabled: IS_ENTERPRISE,
        },
    },
};

const crossHairAxes = {
    category: bottomCrossHairAxisProperties,
    number: bottomCrossHairAxisProperties,
    log: bottomCrossHairAxisProperties,
    time: bottomCrossHairAxisProperties,
};

const crossHairTooltip = {
    position: {
        type: 'sparkline' as any as AgTooltipPositionType,
    },
};

const SPARKLINE_THEME: AgChartTheme = {
    overrides: {
        common: {
            animation: {
                enabled: false,
            },
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            },
            axes: {
                number: {
                    ...numericAxisProperties,
                    interval: {
                        values: [0],
                    },
                },
                log: {
                    ...numericAxisProperties,
                },
                time: {
                    ...numericAxisProperties,
                },
                category: {
                    ...commonAxisProperties,
                },
            },
        },
        bar: {
            series: {
                // @ts-expect-error
                sparklineMode: true,
            },
            tooltip: {
                range: 'nearest',
            },
        },
        line: {
            seriesArea: {
                padding: {
                    top: 2,
                    right: 2,
                    bottom: 2,
                    left: 2,
                },
            },
            axes: crossHairAxes,
            series: {
                // @ts-expect-error
                sparklineMode: true,
                strokeWidth: 1,
                marker: {
                    enabled: false,
                    size: 3,
                },
                tooltip: crossHairTooltip,
            },
        },
        area: {
            seriesArea: {
                padding: {
                    top: 1,
                    right: 0,
                    bottom: 1,
                    left: 0,
                },
            },
            axes: crossHairAxes,
            series: {
                strokeWidth: 1,
                fillOpacity: 0.4,
                tooltip: crossHairTooltip,
            },
        },
    },
};

function setInitialBaseTheme(
    baseTheme: AgChartTheme | AgChartThemeName | undefined,
    initialBaseTheme: AgChartTheme
): AgChartTheme {
    if (typeof baseTheme === 'string') {
        return {
            ...initialBaseTheme,
            baseTheme,
        };
    }

    if (baseTheme != null) {
        return {
            ...baseTheme,
            // @ts-expect-error internal implementation
            baseTheme: setInitialBaseTheme(baseTheme.baseTheme, initialBaseTheme),
        };
    }

    return initialBaseTheme;
}

function axis(
    opts: AgSparklineAxisOptions | undefined,
    defaultType: AgCartesianAxisOptions['type']
): AgCartesianAxisOptions {
    switch (opts?.type) {
        case 'number': {
            const {
                type,
                reverse,
                visible: _visible,
                stroke: _stroke,
                strokeWidth: _strokeWidth,
                min,
                max,
                ...optsRest
            } = opts;
            assertEmpty(optsRest);
            return pickProps<Pick<AgNumberAxisOptions, 'type' | 'reverse' | 'min' | 'max'>>(opts, {
                type,
                reverse,
                min,
                max,
            });
        }
        case 'log': {
            const {
                type,
                reverse,
                visible: _visible,
                stroke: _stroke,
                strokeWidth: _strokeWidth,
                min,
                max,
                base,
                ...optsRest
            } = opts;
            assertEmpty(optsRest);
            return pickProps<Pick<AgLogAxisOptions, 'type' | 'reverse' | 'min' | 'max' | 'base'>>(opts, {
                type,
                reverse,
                min,
                max,
                base,
            });
        }
        case 'time': {
            const {
                type,
                reverse,
                visible: _visible,
                stroke: _stroke,
                strokeWidth: _strokeWidth,
                min,
                max,
                ...optsRest
            } = opts;
            assertEmpty(optsRest);
            return pickProps<Pick<AgTimeAxisOptions, 'type' | 'reverse' | 'min' | 'max'>>(opts, {
                type,
                reverse,
                min,
                max,
            });
        }
        case 'category': {
            const {
                type,
                reverse,
                visible: _visible,
                stroke: _stroke,
                strokeWidth: _strokeWidth,
                paddingInner,
                paddingOuter,
                ...optsRest
            } = opts;
            assertEmpty(optsRest);
            return pickProps<Pick<AgCategoryAxisOptions, 'type' | 'reverse' | 'paddingInner' | 'paddingOuter'>>(opts, {
                type,
                reverse,
                paddingInner,
                paddingOuter,
            });
        }
        case 'ordinal-time': {
            const {
                type,
                reverse,
                visible: _visible,
                stroke: _stroke,
                strokeWidth: _strokeWidth,
                paddingInner,
                paddingOuter,
                interval,
                ...optsRest
            } = opts;
            assertEmpty(optsRest);
            return pickProps<
                Pick<AgOrdinalTimeAxisOptions, 'type' | 'reverse' | 'paddingInner' | 'paddingOuter' | 'interval'>
            >(opts, {
                type,
                reverse,
                paddingInner,
                paddingOuter,
                interval,
            });
        }
    }

    return { type: defaultType };
}

function gridLine(opts: AgSparklineAxisOptions | undefined, defaultEnabled: boolean): AgAxisGridLineOptions {
    const gridLineOpts: AgAxisGridLineOptions = {};
    gridLineOpts.enabled = opts?.visible;
    if (opts?.stroke != null) {
        gridLineOpts.style = [{ stroke: opts?.stroke }];
        gridLineOpts.enabled ??= true;
    }
    if (opts?.strokeWidth != null) {
        gridLineOpts.width = opts?.strokeWidth;
        gridLineOpts.enabled ??= true;
    }
    gridLineOpts.enabled ??= defaultEnabled;
    return gridLineOpts;
}

export function sparkline(opts: AgSparklineOptions): AgCartesianChartOptions {
    const {
        background,
        container,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        padding,
        width,
        theme: baseTheme,
        data,
        xAxis,
        yAxis,
        ...optsRest
    } = opts as any as AgBaseSparklinePresetOptions;
    assertEmpty(optsRest);

    const seriesOptions = optsRest as any as AgCartesianSeriesOptions;

    const swapAxes = seriesOptions.type !== 'bar' || seriesOptions.direction !== 'horizontal';

    const chartOpts: AgCartesianChartOptions = pickProps<AgBaseSparklinePresetOptions>(opts, {
        background,
        container,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        padding,
        width,
        data,
        xAxis: IGNORED_PROP,
        yAxis: IGNORED_PROP,
        theme: IGNORED_PROP,
    });

    chartOpts.theme = setInitialBaseTheme(baseTheme, SPARKLINE_THEME);
    chartOpts.series = [seriesOptions];

    const [xAxisPosition, yAxisPosition] = swapAxes ? (['bottom', 'left'] as const) : (['left', 'bottom'] as const);

    const xAxisBase: AgCartesianAxisOptions = {
        ...axis(xAxis, 'category'),
        gridLine: gridLine(yAxis, false),
        position: xAxisPosition,
    };
    const yAxisBase: AgCartesianAxisOptions = {
        ...axis(yAxis, 'number'),
        gridLine: gridLine(xAxis, true),
        position: yAxisPosition,
    };

    chartOpts.axes = swapAxes ? [yAxisBase, xAxisBase] : [xAxisBase, yAxisBase];

    return chartOpts;
}
