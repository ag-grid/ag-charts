import type {
    AgBaseSparklinePresetOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartTheme,
    AgChartThemeName,
    AgSparklineOptions,
} from 'ag-charts-types';

import { IGNORED_PROP, assertEmpty, pickProps } from './presetUtils';

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
                    nice: false,
                    line: {
                        enabled: false,
                    },
                    gridLine: {
                        enabled: true,
                    },
                    label: {
                        enabled: false,
                    },
                    interval: {
                        values: [0],
                    },
                },
                category: {
                    line: {
                        enabled: false,
                    },
                    label: {
                        enabled: false,
                    },
                },
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
            series: {
                strokeWidth: 1,
                marker: {
                    size: 3,
                },
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
            series: {
                strokeWidth: 1,
                fillOpacity: 0.4,
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
        ...optsRest
    } = opts as any as AgBaseSparklinePresetOptions;
    assertEmpty(optsRest);

    const seriesOptions = optsRest as any as AgCartesianSeriesOptions;

    const chartOpts = pickProps<AgBaseSparklinePresetOptions>(opts, {
        background,
        container,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        padding,
        width,
        theme: IGNORED_PROP,
    });

    return {
        ...chartOpts,
        theme: setInitialBaseTheme(baseTheme, SPARKLINE_THEME),
        series: [seriesOptions],
    };
}
