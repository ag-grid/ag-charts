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

    if (api === 'createGauge') {
        delete options.title;
        delete (options as any).targets;
        delete options.legend;
        (options as any).label = {
            ...(options as any).label,
            fontSize: 36,
        };
    }

    // The bullet series are the only other chart types with multiple examples
    // They've been designed using the old padding values, so leave as-is for now
    if (multiple && api === 'createGauge') {
        options.padding = {
            top: 0,
            right: 0,
            bottom: 0,
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
