/*
 * Reports a Plausible '404' event with the current path once the page loads.
 * Externalised to a 'self' script so the site Content-Security-Policy can drop
 * script-src 'unsafe-inline': an import-less hoisted <script> gets inlined into
 * the page HTML by Astro, which the hash-based policy blocks — and the minified
 * bytes make a static SHA-256 hash unstable.
 */
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        if (!window.plausible) {
            return;
        }

        window.plausible('404', { props: { path: document.location.pathname } });
    });
})();
