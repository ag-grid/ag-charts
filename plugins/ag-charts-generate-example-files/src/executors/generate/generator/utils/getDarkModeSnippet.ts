export const DARK_MODE_START = '/** DARK MODE START **/';
export const DARK_MODE_END = '/** DARK MODE END **/';

export const getDarkModeSnippet = ({ chartAPI }: { chartAPI?: string } = {}) =>
    `${DARK_MODE_START}
${
    chartAPI == null
        ? `import { AgCharts as __chartAPI } from 'ag-charts-community';`
        : `const __chartAPI = ${chartAPI};`
}

let darkmode =
    (localStorage['documentation:darkmode'] ||
        String(matchMedia('(prefers-color-scheme: dark)').matches)) === 'true';

const isAgTheme = (theme) => {
    return typeof theme === 'string' && theme.startsWith('ag-');
};

const getDarkmodeTheme = (theme, darkmode) => {
    const baseTheme = theme.replace(/-dark$/, '');
    return darkmode ? baseTheme + '-dark' : baseTheme;
};

const defaultUpdate = __chartAPI.update;
__chartAPI.update = function update(chart, options) {
    let nextOptions = { ...options };
    let theme = options.theme || 'ag-default';
    if (isAgTheme(theme)) {
        nextOptions.theme = getDarkmodeTheme(theme, darkmode);
    } else if (typeof theme === 'object' && isAgTheme(theme.baseTheme)) {
        nextOptions.theme = {
            ...options.theme,
            baseTheme: getDarkmodeTheme(theme.baseTheme, darkmode),
        };
    }
    defaultUpdate(chart, nextOptions);
};

const applyDarkmode = () => {
    document.documentElement.setAttribute('data-dark-mode', darkmode);
    const charts = document.querySelectorAll('[data-ag-charts]');
    charts.forEach((element) => {
        const chart = __chartAPI.getInstance(element);
        if (chart == null) return;
        // .update is monkey-patched to apply theme to options
        // This is just needed to trigger the theme update
        __chartAPI.update(chart, chart.getOptions());
    });
    return charts.length !== 0;
};

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
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'color-scheme-change') {
        darkmode = event.data.darkmode;
        applyDarkmode();
    }
});
${DARK_MODE_END}`;
