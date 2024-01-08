export const DARK_MODE_START = '/** DARK MODE START **/';
export const DARK_MODE_END = '/** DARK MODE END **/';

export const getDarkModeSnippet = ({ chartAPI }: { chartAPI?: string } = {}) =>
    `${DARK_MODE_START}
${chartAPI == null ? `import { AgCharts as AgChartsAPI } from 'ag-charts-community';` : ''}
let darkmode = (localStorage['documentation:darkmode'] || String(matchMedia('(prefers-color-scheme: dark)').matches)) === 'true';
const applyDarkmode = () => {
    document.head.setAttribute('data-dark-mode', darkmode);
    const charts = document.querySelectorAll('[data-ag-charts]')
    charts.forEach((element) => {
        const chart = ${chartAPI ?? 'AgChartsAPI'}.getInstance(element);
        if (chart == null) return;
        let options = chart.getOptions();
        let theme = options.theme || 'ag-default';
        if (typeof theme === 'string' && theme.startsWith('ag-')) {
            const baseTheme = theme.replace(/-dark$/, '');
            theme = darkmode ? baseTheme + '-dark' : baseTheme;
            options.theme = theme;
        }
        ${chartAPI ?? 'AgChartsAPI'}.update(chart, options);
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
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
}
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'color-scheme-change') {
        darkmode = event.data.darkmode;
        applyDarkmode();
    }
});
${DARK_MODE_END}`;
