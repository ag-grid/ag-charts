/*
 * Toggles the active landing-page example panel in response to tab changes
 * dispatched by the React tabs component (the 'landing-page-feature-tab-change'
 * event). Externalised to a 'self' script so the site Content-Security-Policy can
 * drop script-src 'unsafe-inline': an import-less hoisted <script> gets inlined into
 * the page HTML by Astro, which the hash-based policy blocks — and the minified
 * bytes make a static SHA-256 hash unstable.
 */
(function () {
    document.addEventListener('landing-page-feature-tab-change', function (event) {
        var index = event.detail.index;

        document.querySelectorAll('.landing-page-example-panel').forEach(function (panel) {
            panel.classList.remove('active');
        });

        var activePanel = document.querySelector('.landing-page-example-panel[data-index="' + index + '"]');
        if (activePanel) {
            activePanel.classList.add('active');
        }
    });
})();
