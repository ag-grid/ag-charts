import { DARK_MODE_END, DARK_MODE_START } from '@ag-website-shared/utils/extraCodeSnippets';

export const getDarkModeSnippet = ({ chartAPI }: { chartAPI?: string } = {}) =>
    `${DARK_MODE_START}
${
    chartAPI == null
        ? `import { AgCharts as __chartAPI } from 'ag-charts-community';`
        : `const __chartAPI = ${chartAPI};`
}

let darkmode =
    (localStorage['documentation:darkmode'] || String(matchMedia('(prefers-color-scheme: dark)').matches)) === 'true';

const isAgThemeOrUndefined = (theme) => {
    return theme == null || (typeof theme === 'string' && theme.startsWith('ag-'));
};

const getDarkmodeTheme = (theme = 'ag-default', preset) => {
    const baseTheme = preset === 'price-volume' ? 'ag-financial' : theme.replace(/-dark$/, '');
    return darkmode ? baseTheme + '-dark' : baseTheme;
};

__chartAPI.optionsMutationFn = function update(options, preset) {
    const nextOptions = { ...options };
    const theme = options.theme;
    if (isAgThemeOrUndefined(theme)) {
        nextOptions.theme = getDarkmodeTheme(theme, preset);
    } else if (typeof theme === 'object' && isAgThemeOrUndefined(theme.baseTheme)) {
        nextOptions.theme = {
            ...options.theme,
            baseTheme: getDarkmodeTheme(theme.baseTheme, preset),
        };
    }
    return nextOptions;
};

const applyDarkmode = () => {
    document.documentElement.setAttribute('data-dark-mode', darkmode);
    const charts = document.querySelectorAll('[data-ag-charts]');
    charts.forEach((element) => {
        const chart = __chartAPI.getInstance(element.parentElement);
        if (chart == null) return;
        // This is just needed to trigger the theme update
        chart.update(chart.getOptions());
    });
    return charts.length !== 0;
};

if (darkmode) {
    if (!applyDarkmode()) {
        /* React defers updates. Rather than try and hook into the API, just wait until the darkmode is applied. */
        const observer = new MutationObserver(() => {
            if (applyDarkmode()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    }
}
const onColorSchemeChange = (data) => {
    if (data?.type === 'color-scheme-change') {
        darkmode = data.darkmode;
        applyDarkmode();
    }
};

// Two delivery channels: a real postMessage when this example runs inside the example-runner
// iframe, and a same-page CustomEvent when it is embedded directly in the docs page.
window.addEventListener('message', (event) => onColorSchemeChange(event.data));
window.addEventListener('ag-color-scheme-change', (event) => onColorSchemeChange(event.detail));
${DARK_MODE_END}`;
