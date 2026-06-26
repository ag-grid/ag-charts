/*
 * Homepage gallery chart manager. Externalised from an inline `define:vars` script
 * (see HomepageGalleryExamples.astro) so the site Content-Security-Policy can drop
 * script-src 'unsafe-inline'. This script embeds build-hashed CSS-module class
 * names, so a static SHA-256 hash would change every build — hence externalisation
 * rather than hashing. Configuration arrives via data- attributes.
 *
 * Must load as a classic, non-deferred script placed after the AgCharts UMD script:
 * it reads document.currentScript (only set during synchronous execution), so the
 * data- attributes are captured up front for use by the deferred init().
 */
(function () {
    const el = document.currentScript;
    const initialExampleId = el.dataset.initialExampleId;
    const buttonsClass = el.dataset.buttonsClass;
    const activeButtonClass = el.dataset.activeButtonClass;
    const GLOBAL_UPDATE_EXAMPLES_VARIABLE = el.dataset.updateExamplesVar;
    const GLOBAL_UPDATE_FUNCTION_NAME = el.dataset.updateFnName;
    const loadingId = el.dataset.loadingId;

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
        };
    }

    const chartManager = createChartManager({
        agCharts: agCharts.AgCharts,
        onFirstLoad: () => {
            removeLoading();
        },
    });
    const buttons = document.querySelectorAll(`.${buttonsClass}`);
    function updateActiveButton(button) {
        buttons.forEach((btn) => btn.classList.remove(activeButtonClass));
        button.classList.add(activeButtonClass);
    }

    function removeLoading() {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    function updateExample(exampleId) {
        const button = document.querySelector(`.${buttonsClass}[data-example-id="${exampleId}"]`);
        updateActiveButton(button);

        window[GLOBAL_UPDATE_EXAMPLES_VARIABLE][exampleId]();
    }

    function init() {
        let currentExampleId = initialExampleId;

        // Called from example `updateExample` function
        window[GLOBAL_UPDATE_FUNCTION_NAME] = (options) => {
            chartManager.apply({
                options,
            });
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

            if (initialExampleId === exampleId) {
                updateExample(exampleId);
            }
        });
    }

    // Initialise once DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
})();
