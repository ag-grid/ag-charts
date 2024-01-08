import type { AgCartesianChartOptions, AgChartOptions, AgChartTheme, AgChartThemeName } from 'ag-charts-community';

export function patchOptions(options: AgChartOptions, theme: AgChartThemeName) {
    delete options.subtitle;
    delete options.footnote;
    delete options.legend;
    delete options.gradientLegend;

    options.legend = { enabled: false };

    const optionsTheme = typeof options.theme === 'object' ? options.theme : null;
    options.theme = {
        ...optionsTheme,
        baseTheme: theme ?? 'ag-default',
        overrides: {
            ...optionsTheme?.overrides,
            common: {
                ...optionsTheme?.overrides?.common,
                axes: {
                    ...optionsTheme?.overrides?.common?.axes,
                    category: {
                        ...optionsTheme?.overrides?.common?.axes?.category,
                        label: {
                            ...optionsTheme?.overrides?.common?.axes?.category?.label,
                            autoRotate: false,
                            minSpacing: 20,
                        },
                    },
                },
            },
        },
    } as AgChartTheme;

    (options as any as AgCartesianChartOptions).axes?.forEach((axis) => {
        axis.title = { enabled: false };
    });

    options.padding = {
        top: 10,
        right: 20,
        bottom: 10,
        left: 20,
    };
}
