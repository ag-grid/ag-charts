/*
 * Homepage gallery chart manager. Externalised from an inline `define:vars` script
 * (see HomepageGalleryExamples.astro) so the site Content-Security-Policy can drop
 * script-src 'unsafe-inline'. This script embeds build-hashed CSS-module class
 * names, so a static SHA-256 hash would change every build — hence externalisation
 * rather than hashing. Configuration arrives via data- attributes.
 *
 * Must load as a classic script so document.currentScript resolves (it is only set
 * during synchronous execution) and the data- attributes can be captured up front.
 *
 * Initialisation hangs off astro:page-load rather than DOMContentLoaded, and waits
 * for the AgCharts UMD instead of assuming it: the client-side router replaces the
 * whole <body> and re-inserts scripts dynamically, so they no longer run in
 * document order, DOMContentLoaded does not fire again, and this file is executed
 * at most once per session — so the listener has to outlive it.
 */
(function () {
    const el = document.currentScript;
    const config = {
        initialExampleId: el.dataset.initialExampleId,
        buttonsClass: el.dataset.buttonsClass,
        activeButtonClass: el.dataset.activeButtonClass,
        updateExamplesVariable: el.dataset.updateExamplesVar,
        updateFunctionName: el.dataset.updateFnName,
        loadingId: el.dataset.loadingId,
    };

    if (globalThis.__agHomepageGalleryListening) {
        return;
    }
    globalThis.__agHomepageGalleryListening = true;

    const UMD_TIMEOUT_MS = 10000;
    let activeChartManager = null;

    function createChartManager({ agCharts, onFirstLoad }) {
        let chartInstance = null;
        let currentChartIsGauge = false;
        let chartState = 'init';

        const isGauge = (chartType) => {
            return chartType?.endsWith('gauge');
        };
        const createChart = ({ options }) => {
            const createMethod = isGauge(options.type) ? 'createGauge' : 'create';
            chartInstance = agCharts[createMethod](options);

            if (chartState === 'init') {
                chartInstance
                    ?.waitForUpdate()
                    .then(() => {
                        chartState = 'active';
                        onFirstLoad?.();
                    })
                    .catch(() => {});
            }
        };
        const apply = ({ options }) => {
            if (chartState === 'init') {
                createChart({ options });
                return;
            }

            const optionsIsGauge = isGauge(options.type);
            const shouldDestroy = currentChartIsGauge !== optionsIsGauge;

            if (shouldDestroy) {
                chartInstance?.destroy();
                createChart({ options });
            } else {
                chartInstance?.update(options);
            }

            currentChartIsGauge = optionsIsGauge;
        };

        return {
            apply,
            destroy: () => {
                chartInstance?.destroy();
                chartInstance = null;
            },
        };
    }

    function init() {
        const buttons = document.querySelectorAll(`.${config.buttonsClass}`);
        if (buttons.length === 0) {
            return;
        }

        const chartManager = createChartManager({
            agCharts: globalThis.agCharts.AgCharts,
            onFirstLoad: () => {
                document.getElementById(config.loadingId)?.remove();
            },
        });
        activeChartManager = chartManager;

        let currentExampleId = config.initialExampleId;

        // Called from example `updateExample` function
        window[config.updateFunctionName] = (options) => {
            chartManager.apply({ options });
        };

        const updateExample = (exampleId) => {
            const button = document.querySelector(`.${config.buttonsClass}[data-example-id="${exampleId}"]`);
            buttons.forEach((btn) => btn.classList.remove(config.activeButtonClass));
            button?.classList.add(config.activeButtonClass);

            window[config.updateExamplesVariable][exampleId]();
        };

        buttons.forEach((button) => {
            const { exampleId } = button.dataset;

            button.addEventListener('click', () => {
                if (exampleId === currentExampleId) {
                    return;
                }

                currentExampleId = exampleId;

                updateExample(exampleId);
            });

            if (config.initialExampleId === exampleId) {
                updateExample(exampleId);
            }
        });
    }

    function whenReady(callback) {
        if (globalThis.agCharts && globalThis[config.updateExamplesVariable]) {
            callback();
            return;
        }

        const deadline = Date.now() + UMD_TIMEOUT_MS;
        const poll = () => {
            if (globalThis.agCharts && globalThis[config.updateExamplesVariable]) {
                callback();
            } else if (Date.now() < deadline) {
                requestAnimationFrame(poll);
            }
            // Otherwise give up quietly and leave the loading state in place.
        };
        requestAnimationFrame(poll);
    }

    document.addEventListener('astro:page-load', () => {
        if (!document.getElementById(config.loadingId)) {
            // Not the homepage (or the gallery is absent) — nothing to wire up.
            return;
        }
        whenReady(init);
    });

    // The chart outlives the <body> it was attached to unless it is torn down.
    document.addEventListener('astro:before-swap', () => {
        activeChartManager?.destroy();
        activeChartManager = null;
    });
})();
