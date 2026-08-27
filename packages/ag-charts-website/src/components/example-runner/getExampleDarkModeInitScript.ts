/**
 * Source of the example document's `data-dark-mode`, which `example-chart-theme.css` turns into the
 * chart theme's colour variables. Runs render-blocking in the example's `<head>` so the attribute is
 * set before the chart is created, and keeps it in step with the site's toggle afterwards.
 */
export const getExampleDarkModeInitFragment = ({ ignoreDarkMode }: { ignoreDarkMode?: boolean }) =>
    ignoreDarkMode
        ? ''
        : `<script nonce="123123">
(function () {
    const htmlEl = document.documentElement;

    let storedDarkmode;
    try {
        storedDarkmode = localStorage['documentation:darkmode'];
    } catch (e) {
        /* Storage can be unavailable, in which case the OS preference stands in. */
    }

    const setDarkmode = (darkmode) => {
        htmlEl.dataset.darkMode = String(darkmode === true);
    };

    setDarkmode((storedDarkmode ?? String(matchMedia('(prefers-color-scheme: dark)').matches)) === 'true');

    // Two delivery channels, each read from the property its own channel provides: a real
    // postMessage when this example runs inside the example-runner iframe, and a same-page
    // CustomEvent when it is embedded directly in the docs page.
    const onColorSchemeChange = (data) => {
        if (data?.type === 'color-scheme-change') {
            setDarkmode(data.darkmode);
        }
    };

    window.addEventListener('message', (event) => onColorSchemeChange(event.data));
    window.addEventListener('ag-color-scheme-change', (event) => onColorSchemeChange(event.detail));
})();
</script>`;
