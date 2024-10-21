import type { AgCartesianChartOptions, AgChartOptions, AgChartTheme, AgChartThemeName } from 'ag-charts-community';

export function patchOptions(
    options: AgChartOptions,
    theme: AgChartThemeName,
    multiple: boolean,
    api: 'create' | 'createGauge' | 'createFinancialChart'
) {
    delete options.subtitle;
    delete options.footnote;
    delete options.gradientLegend;

    options.legend = { enabled: false };

    if (options.series?.some((s) => ['treemap', 'heatmap'].includes(s.type))) {
        options.gradientLegend = { enabled: false };
    }

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
            'radial-gauge': multiple
                ? {
                      label: {
                          fontSize: 36,
                      },
                  }
                : {},
        },
    } as AgChartTheme;

    (options as any as AgCartesianChartOptions).axes?.forEach((axis) => {
        axis.title = { enabled: false };
    });

    if (api === 'createGauge') {
        delete options.title;
        delete options.legend;
    }

    if (api === 'createGauge' && multiple) {
        (options as any).targets?.forEach((target) => {
            delete target.text;
        });
    }

    if (multiple) {
        options.padding = {
            top: 5,
            right: 0,
            bottom: 5,
            left: 0,
        };
    } else {
        options.padding = {
            top: 10,
            right: 20,
            bottom: 10,
            left: 20,
        };
    }
}
