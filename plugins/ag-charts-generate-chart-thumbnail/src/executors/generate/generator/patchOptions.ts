import type { AgCartesianChartOptions, AgChartOptions, AgChartTheme, AgChartThemeName } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { ExampleSubstitutions } from 'ag-charts-generate-example-files';

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

    if (options.series?.some((s) => ['treemap', 'heatmap', 'sunburst'].includes(s.type))) {
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
        if (typeof axis.title !== 'undefined') {
            axis.title = { enabled: false };
        }
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

    return maybeApplySubstitutions(options);
}

const DEFAULT_SUBSTITUTIONS: ExampleSubstitutions = {
    '${baseWWWUrl}': `${process.cwd()}/packages/ag-charts-website/public`,
};

const maybeApplySubstitutions = (node: unknown) => {
    if (typeof node === 'object') {
        _ModuleSupport.jsonWalk(node, (nodes) => {
            for (const key of Object.keys(nodes)) {
                const value = nodes[key];
                if (typeof value === 'string') {
                    nodes[key] = applySubstitutions(value, DEFAULT_SUBSTITUTIONS);
                } else if (typeof value === 'function') {
                    nodes[key] = (...args) => {
                        return maybeApplySubstitutions(value(...args));
                    };
                }
            }
        });
    } else if (typeof node === 'string') {
        return applySubstitutions(node, DEFAULT_SUBSTITUTIONS);
    }

    return node;
};

const applySubstitutions = (content: string, substitutions?: ExampleSubstitutions) => {
    if (content == null || substitutions == null || !content.includes('${')) {
        return content;
    }

    Object.keys(substitutions).forEach((key) => {
        const value = substitutions[key];
        if (value == null) {
            throw new Error(`Substitution value is null for key: ${key}`);
        }

        const newContent = content.replace(key, value);
        if (content !== newContent) {
            // eslint-disable-next-line no-console
            console.info(`Applied substitutions for ${key} => ${newContent}`);
        }

        content = newContent;
    });

    return content;
};
