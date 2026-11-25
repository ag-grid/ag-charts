/*
 * Homepage gallery chart manager. Externalised from an inline `define:vars` script
 * (see HomepageGalleryExamples.astro) so the site Content-Security-Policy can drop
 * script-src 'unsafe-inline'. Configuration arrives via data- attributes, and the
 * HomepageGalleryTabs island announces tab changes with a document event.
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
        tablistId: el.dataset.tablistId,
        selectEvent: el.dataset.selectEvent,
        updateExamplesVariable: el.dataset.updateExamplesVar,
        updateFunctionName: el.dataset.updateFnName,
        loadingId: el.dataset.loadingId,
    };

    if (globalThis.__agHomepageGalleryListening) {
        return;
    }
    globalThis.__agHomepageGalleryListening = true;

    let activeChartManager = null;
    let activeUpdateExample = null;
    // Bumped per mount and on every swap, so a readiness poll started by an earlier visit
    // cannot initialise a later one (which would leave two chart managers on one
    // container, only the last of them reachable for teardown).
    let mountId = 0;

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
        const tablist = document.getElementById(config.tablistId);
        if (!tablist) {
            return;
        }

        const chartManager = createChartManager({
            agCharts: globalThis.agCharts.AgCharts,
            onFirstLoad: () => {
                document.getElementById(config.loadingId)?.remove();
            },
        });
        activeChartManager = chartManager;

        // Called from example `updateExample` function
        window[config.updateFunctionName] = (options) => {
            chartManager.apply({ options });
        };

        activeUpdateExample = (exampleId) => {
            window[config.updateExamplesVariable][exampleId]();
        };

        // The island can hydrate and take a click before the chart library is ready
        const selectedTab = tablist.querySelector('[aria-selected="true"]');
        if (selectedTab) {
            activeUpdateExample(selectedTab.dataset.exampleId);
        }
    }

    // Waits for the AgCharts UMD and the examples bundle, both of which are separate
    // <script>s that the router re-inserts without preserving document order. Polling is
    // unbounded rather than deadlined: leaving the page cancels it, so a slow connection
    // still resolves instead of stranding the gallery in its loading state.
    function whenReady(generation, callback) {
        const isReady = () => globalThis.agCharts && globalThis[config.updateExamplesVariable];
        const poll = () => {
            if (generation !== mountId) {
                return; // Superseded by a later navigation.
            }
            if (isReady()) {
                callback();
            } else {
                requestAnimationFrame(poll);
            }
        };
        poll();
    }

    document.addEventListener(config.selectEvent, (event) => {
        activeUpdateExample?.(event.detail.exampleId);
    });

    document.addEventListener('astro:page-load', () => {
        if (!document.getElementById(config.loadingId)) {
            // Not the homepage (or the gallery is absent) — nothing to wire up.
            return;
        }

        const generation = ++mountId;
        whenReady(generation, init);
    });

    // The chart outlives the <body> it was attached to unless it is torn down.
    document.addEventListener('astro:before-swap', () => {
        mountId++;
        activeChartManager?.destroy();
        activeChartManager = null;
        activeUpdateExample = null;
    });
})();
