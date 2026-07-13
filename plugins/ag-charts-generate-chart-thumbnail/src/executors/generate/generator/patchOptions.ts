import * as fs from 'fs';

import type { AgCartesianChartOptions, AgChartOptions, AgChartTheme, AgChartThemeName } from 'ag-charts-community';
import { jsonWalk } from 'ag-charts-core';
import type { ExampleSubstitutions } from 'ag-charts-generate-example-files';

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
    options.animation = { enabled: false };

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

    for (const id of Object.keys((options as any as AgCartesianChartOptions).axes ?? {})) {
        const axis = (options as any as AgCartesianChartOptions).axes[id];
        if (typeof axis.title !== 'undefined') {
            axis.title = { enabled: false };
        }
    }

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

function safeSet(obj, key, value) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);

    if (!desc || desc.writable || desc.set) {
        obj[key] = value;
    } else {
        console.warn(`Skipped read-only property: ${key}`);
    }
}

const maybeApplySubstitutions = (node: unknown) => {
    if (typeof node === 'object') {
        jsonWalk(node, (nodes) => {
            for (const key of Object.keys(nodes)) {
                const value = nodes[key];
                if (typeof value === 'string') {
                    // Inline static string case.
                    const newValue = applySubstitutions(value);
                    safeSet(nodes, key, newValue);
                } else if (typeof value === 'function') {
                    // Callback function case (apply substitutions to the result).
                    const newValue = (...args) => maybeApplySubstitutions(value(...args));
                    safeSet(nodes, key, newValue);
                }
            }
        });
    } else if (typeof node === 'string') {
        return applySubstitutions(node);
    }

    return node;
};

// Substituted strings (including base64-inlined images) are identical across the theme x DPI
// render loop, so cache per original string to avoid re-reading and re-encoding per render.
// The cache is only safe because substitutions are always DEFAULT_SUBSTITUTIONS (fixed per
// process) — do not reintroduce a caller-supplied substitutions parameter without keying on it.
const substitutionCache = new Map<string, string>();

const applySubstitutions = (content: string) => {
    const substitutions = DEFAULT_SUBSTITUTIONS;
    if (content == null || !content.includes('${')) {
        return content;
    }

    const cached = substitutionCache.get(content);
    if (cached != null) {
        return cached;
    }
    const original = content;

    Object.keys(substitutions).forEach((key) => {
        const value = substitutions[key];
        if (value == null) {
            throw new Error(`Substitution value is null for key: ${key}`);
        }

        content = content.replace(key, value);

        // Inline images to simplify processing.
        if (content.endsWith('.png') || content.endsWith('.svg')) {
            const imageBuffer = fs.readFileSync(content);
            const imageType = content.endsWith('.png') ? 'png' : 'svg+xml';
            content = `data:image/${imageType};base64,${imageBuffer.toString('base64')}`;
        }
    });

    substitutionCache.set(original, content);
    return content;
};
