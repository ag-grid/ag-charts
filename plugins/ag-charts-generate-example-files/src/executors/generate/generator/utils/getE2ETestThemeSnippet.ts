export const E2E_THEME_START = '/** E2E THEME START **/';
export const E2E_THEME_END = '/** E2E THEME END **/';

export const getE2ETestThemeSnippet = ({ chartAPI }: { chartAPI?: string } = {}) =>
    `${E2E_THEME_START}
{
${chartAPI == null ? `` : `const __chartAPI = ${chartAPI};`}

if (window && window.location.hash.includes('e2e=true')) {
    __chartAPI.optionsMutationFn = function update(options, preset) {
        const nextOptions = { ...options };
        const theme = options.theme;
        const overrides = {
            axisLineColor: '#b4b6b6',
            borderColor: 'rgba(24, 29, 31, 0.15)',
            fontFamily: 'Verdana, sans-serif',
            focusShadow: '0 0 0 3px var(--ag-charts-accent-color)',
            gridLineColor: '#e8e8e9',
        }
        if (isAgThemeOrUndefined(theme)) {
            nextOptions.theme = {
                baseTheme: preset === 'price-volume' ? 'ag-financial' : theme,
                params: overrides,
            };
        } else if (typeof theme === 'object' && isAgThemeOrUndefined(theme.baseTheme)) {
            nextOptions.theme = {
                ...options.theme,
                params: { ...(options.theme.params || {}), ...overrides },
                baseTheme: preset === 'price-volume' ? 'ag-financial' : theme,
            };
        }

        return nextOptions;
    };

    const applyE2ETestTheme = () => {
        const charts = document.querySelectorAll('[data-ag-charts]');
        charts.forEach((element) => {
            const chart = __chartAPI.getInstance(element.parentElement);
            if (chart == null) return;
            // This is just needed to trigger the theme update
            chart.update(chart.getOptions());
        });
        return charts.length !== 0;
    };

    applyE2ETestTheme();
}

}
${E2E_THEME_END}`;
