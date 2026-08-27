// NOTE: The homepage gallery keeps its own copy of this plumbing in
// `packages/ag-charts-website/src/utils/getDarkModeSnippet.ts`.
export const DARK_MODE_START = '/** DARK MODE START **/';
export const DARK_MODE_END = '/** DARK MODE END **/';

/**
 * Points the default theme at the colour variables `example-chart-theme.css` flips with
 * `data-dark-mode`. AG Charts resolves `var()` colours against the chart container and watches them
 * for changes, so an example paints in the right scheme first time and repaints itself on a toggle.
 *
 * Only the parameters `ag-default-dark` retunes are listed; the rest are `$ref`s onto these and
 * follow. What no parameter can carry is the palette, and `ag-default-dark` retunes that too - so
 * the series listed in `PALETTE_SENSITIVE_TYPES`, and every non-default theme and preset, keep
 * resolving the `-dark` theme name and still need an explicit re-render.
 */
const THEME_MUTATION = `
/**
 * Series whose visible colours come from the parts of the palette that differ between
 * \`ag-default\` and \`ag-default-dark\` - marker and candle strokes, the hierarchy ramp, and the
 * second sequential colours. A CSS variable cannot reach any of them: \`theme.palette\` takes no
 * option for the hierarchy or sequential colours, and supplying \`strokes\` would flip
 * \`paletteType\` to \`user-indexed\`, which changes how ~8 series types render in light mode too.
 */
const PALETTE_SENSITIVE_TYPES = new Set([
    'scatter',
    'bubble',
    'candlestick',
    'ohlc',
    'treemap',
    'cone-funnel',
    'radial-gauge',
    'linear-gauge',
    'map-shape-background',
    'map-line-background',
]);

const isPaletteSensitive = (options) => {
    if (PALETTE_SENSITIVE_TYPES.has(options.type)) return true;
    return (options.series ?? []).some((series) => PALETTE_SENSITIVE_TYPES.has(series?.type));
};

const DEFAULT_THEME_PARAMS = {
    axisLineColor: 'var(--ag-example-chart-axis-line-color)',
    backgroundColor: 'var(--ag-example-chart-background-color)',
    borderColor: 'var(--ag-example-chart-border-color)',
    chromeBackgroundColor: 'var(--ag-example-chart-chrome-background-color)',
    crosshairLabelBackgroundColor: 'var(--ag-example-chart-crosshair-label-background-color)',
    foregroundColor: 'var(--ag-example-chart-foreground-color)',
    gridLineColor: 'var(--ag-example-chart-grid-line-color)',
    groupedCategoryLineColor: 'var(--ag-example-chart-grouped-category-line-color)',
    subtleTextColor: 'var(--ag-example-chart-subtle-text-color)',
};

const isDarkmode = () => document.documentElement.dataset.darkMode === 'true';

const getDarkmodeTheme = (theme = 'ag-default', preset) => {
    const baseTheme = preset === 'price-volume' ? 'ag-financial' : theme.replace(/-dark$/, '');
    return isDarkmode() ? baseTheme + '-dark' : baseTheme;
};

let hasSwappedTheme = false;

__chartAPI.optionsMutationFn = function update(options, preset) {
    const theme = options.theme;
    const isThemeObject = typeof theme === 'object' && theme != null;
    const baseTheme = isThemeObject ? theme.baseTheme : theme;
    const params = isThemeObject ? theme.params : undefined;

    if (!isAgThemeOrUndefined(baseTheme)) return options;

    // Every other colour is derived from these two, so an example setting either has a scheme of
    // its own that these variables would only half-overwrite.
    const setsOwnScheme = params?.backgroundColor != null || params?.foregroundColor != null;
    const isDefaultTheme = baseTheme == null || baseTheme.replace(/-dark$/, '') === 'ag-default';

    if (preset == null && isDefaultTheme && !setsOwnScheme && !isPaletteSensitive(options)) {
        return {
            ...options,
            theme: {
                ...(isThemeObject ? theme : null),
                baseTheme: 'ag-default',
                params: { ...DEFAULT_THEME_PARAMS, ...params },
            },
        };
    }

    hasSwappedTheme = true;
    return {
        ...options,
        theme: isThemeObject
            ? { ...theme, baseTheme: getDarkmodeTheme(baseTheme, preset) }
            : getDarkmodeTheme(baseTheme, preset),
    };
};

// The page shell owns the example document's \`data-dark-mode\`, setting it before this runs and
// keeping it in step with the site's toggle.
new MutationObserver(() => {
    if (!hasSwappedTheme) return;
    document.querySelectorAll('[data-ag-charts]').forEach((element) => {
        const chart = __chartAPI.getInstance(element.parentElement);
        if (chart == null) return;
        chart.update(chart.getOptions());
    });
}).observe(document.documentElement, { attributeFilter: ['data-dark-mode'] });
`;

/** `fixedTheme` pins the example to the theme it configures; `data-dark-mode` still tracks the site. */
export const getDarkModeSnippet = ({ chartAPI, fixedTheme }: { chartAPI?: string; fixedTheme?: boolean } = {}) =>
    `${DARK_MODE_START}
${
    chartAPI == null
        ? `import { AgCharts as __chartAPI } from 'ag-charts-community';`
        : `const __chartAPI = ${chartAPI};`
}

const isAgThemeOrUndefined = (theme) => {
    return theme == null || (typeof theme === 'string' && theme.startsWith('ag-'));
};
${fixedTheme ? '' : THEME_MUTATION}
${DARK_MODE_END}`;
