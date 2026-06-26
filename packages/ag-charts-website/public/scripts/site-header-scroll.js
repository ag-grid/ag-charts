/*
 * Toggles a CSS class on the site header once the page scrolls past a threshold.
 * Externalised to a 'self' script so the site Content-Security-Policy can drop
 * script-src 'unsafe-inline': a single-importer hoisted <script> gets inlined into
 * the page HTML by Astro, which the hash-based policy blocks — and the minified
 * bytes make a static SHA-256 hash unstable. Config passes via data- attributes.
 *
 * Must be loaded as a classic, non-deferred script: it reads
 * document.currentScript, which is only set during synchronous execution.
 */
(function () {
    var el = document.currentScript;
    var targetSelector = el && el.dataset.targetSelector;
    var scrolledClass = el && el.dataset.scrolledClass;
    var scrollPosition = Number(el && el.dataset.scrollPosition);
    if (!targetSelector || !scrolledClass || !Number.isFinite(scrollPosition)) {
        return;
    }

    function updateScrolledClass() {
        var target = document.querySelector(targetSelector);
        if (!target) {
            return;
        }
        var windowScrollPosition = window.scrollY || document.documentElement.scrollTop;
        if (windowScrollPosition >= scrollPosition) {
            target.classList.add(scrolledClass);
        } else {
            target.classList.remove(scrolledClass);
        }
    }

    window.addEventListener('scroll', updateScrolledClass);
    updateScrolledClass();
})();
