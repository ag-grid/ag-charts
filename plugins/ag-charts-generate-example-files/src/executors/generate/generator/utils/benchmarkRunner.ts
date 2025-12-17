/**
 * Full benchmark runner implementation that gets written to benchmark.js
 * in generated examples that define getBenchmarkConfig().
 */
export const benchmarkRunner = `
/**
 * Benchmark Types
 */

/**
 * Result of a single benchmark test
 */

/**
 * Method configuration for a benchmark test case
 */

/**
 * Test case configuration
 */

/**
 * Configuration returned by getBenchmarkConfig() in the example
 */

/**
 * BenchmarkUI - Self-contained UI management for benchmarks
 * Creates all necessary DOM elements dynamically
 */
class BenchmarkUI {
    constructor() {
        this.container = null;
        this.progressElement = null;
        this.resultsElement = null;
        this.errorElement = null;
        this.runButton = null;
    }

    /**
     * Initialize the benchmark UI by creating DOM elements
     */
    init() {
        this.createBenchmarkContainer();
        this.injectRunButton();
    }

    createBenchmarkContainer() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'benchmarkContainer';
        this.container.style.cssText = 'display: none; background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-top: 10px;';

        // Progress element
        this.progressElement = document.createElement('div');
        this.progressElement.id = 'benchmarkProgress';
        this.progressElement.textContent = 'Initializing...';
        this.container.appendChild(this.progressElement);

        // Error element
        this.errorElement = document.createElement('div');
        this.errorElement.id = 'benchmarkError';
        this.errorElement.style.cssText = 'display: none; color: #dc3545; margin-top: 10px; padding: 10px; background: #f8d7da; border-radius: 4px;';
        this.container.appendChild(this.errorElement);

        // Results element
        this.resultsElement = document.createElement('div');
        this.resultsElement.id = 'benchmarkResults';
        this.container.appendChild(this.resultsElement);

        // Insert after example controls or chart
        const exampleControls = document.querySelector('.example-controls');
        const chartElement = document.getElementById('myChart');
        const insertAfter = exampleControls || chartElement;

        if (insertAfter && insertAfter.parentNode) {
            insertAfter.parentNode.insertBefore(this.container, insertAfter.nextSibling);
        } else {
            document.body.appendChild(this.container);
        }
    }

    injectRunButton() {
        // Find or create controls container
        let controlsRow = document.querySelector('.controls-row');
        if (!controlsRow) {
            const exampleControls = document.querySelector('.example-controls');
            if (exampleControls) {
                controlsRow = document.createElement('div');
                controlsRow.className = 'controls-row';
                exampleControls.appendChild(controlsRow);
            } else {
                // Create example-controls structure if it doesn't exist
                const exampleControlsContainer = document.createElement('div');
                exampleControlsContainer.className = 'example-controls';
                controlsRow = document.createElement('div');
                controlsRow.className = 'controls-row';
                exampleControlsContainer.appendChild(controlsRow);

                const chartElement = document.getElementById('myChart');
                if (chartElement && chartElement.parentNode) {
                    chartElement.parentNode.insertBefore(exampleControlsContainer, chartElement);
                } else {
                    document.body.insertBefore(exampleControlsContainer, document.body.firstChild);
                }
            }
        }

        // Create run benchmark button
        this.runButton = document.createElement('button');
        this.runButton.id = 'runBenchmarkBtn';
        this.runButton.textContent = 'Run Benchmark';
        this.runButton.style.cssText = 'margin-left: auto; background-color: #4caf50; color: white; border: none; padding: 5px 15px; cursor: pointer; border-radius: 4px;';
        controlsRow.appendChild(this.runButton);
    }

    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    hideControls() {
        const controlsRow = document.querySelector('.controls-row');
        if (controlsRow) {
            controlsRow.style.display = 'none';
        }
    }

    showControls() {
        const controlsRow = document.querySelector('.controls-row');
        if (controlsRow) {
            controlsRow.style.display = '';
        }
    }

    showError(message) {
        if (this.errorElement) {
            this.errorElement.textContent = message;
            this.errorElement.style.display = 'block';
        }
    }

    updateProgress(status, currentTest, completedTests, totalTests, updateIndex, totalUpdates, version, warnings, showExportButton = false) {
        if (!this.progressElement) return;

        const statusColor = status === 'running' ? '#6c757d' : '#28a745';
        const statusText = status === 'running' ? 'Running' : 'Complete';
        const testProgress = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
        const updateProgress = totalUpdates > 0 ? Math.round((updateIndex / totalUpdates) * 100) : 0;

        let warningsBadges = '';
        if (warnings && warnings.length > 0) {
            warningsBadges = warnings
                .map(warning =>
                    \`<span style="background: #fff3cd; color: #856404; padding: 4px 10px; border-radius: 12px; border: 1px solid #ffeaa7; font-size: 11px; font-weight: 500; white-space: nowrap;">⚠️ \${warning}</span>\`
                )
                .join('');
        }

        const exportButton = showExportButton
            ? \`<button id="exportBenchmarkResults" style="background: linear-gradient(to bottom, #0066cc 0%, #0052a3 100%); color: white; border: none; border-radius: 4px; padding: 4px 12px; font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap;">Export JSON</button>\`
            : '';

        this.progressElement.style.cssText = 'padding: 0; background-color: transparent; border: none; border-radius: 0; font-family: system-ui, -apple-system, sans-serif;';
        this.progressElement.innerHTML = \`
            <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between;">
                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                    <span style="background: \${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        \${statusText}
                    </span>
                    <span style="background: #0066cc; color: white; padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; white-space: nowrap;">
                        \${currentTest}
                    </span>
                    <span style="background: white; color: #495057; padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; border: 1px solid #dee2e6; white-space: nowrap;">
                        Tests: \${completedTests}/\${totalTests} <strong style="color: #0066cc;">\${testProgress}%</strong>
                    </span>
                    <span style="background: white; color: #495057; padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; border: 1px solid #dee2e6; white-space: nowrap;">
                        Updates: \${updateIndex}/\${totalUpdates} <strong style="color: #0066cc;">\${updateProgress}%</strong>
                    </span>
                    \${warningsBadges}
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="background: #e7f1ff; color: #0066cc; padding: 4px 12px; border-radius: 12px; border: 1px solid #b3d9ff; font-size: 12px; font-weight: 500; white-space: nowrap;">
                        v\${version}
                    </span>
                    \${exportButton}
                </div>
            </div>
        \`;
    }

    displayResults(results, formatTestCase, formatMethod, version, metadata) {
        if (!this.resultsElement) return;

        let html = \`
            <style>
                .benchmark-table-container {
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                }
                .benchmark-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                }
                .benchmark-table thead {
                    background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                .benchmark-table th {
                    padding: 12px 16px;
                    text-align: left;
                    font-weight: 600;
                    color: #495057;
                    border: 1px solid #dee2e6;
                    text-transform: uppercase;
                    font-size: 12px;
                    letter-spacing: 0.5px;
                }
                .benchmark-table th:nth-child(n+3) {
                    text-align: right;
                }
                .benchmark-table td {
                    padding: 10px 16px;
                    border: 1px solid #dee2e6;
                    color: #212529;
                }
                .benchmark-table td:nth-child(n+3) {
                    text-align: right;
                    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                    font-size: 13px;
                }
                .benchmark-table tbody tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                .benchmark-table tbody tr:hover {
                    background-color: #e7f1ff;
                    transition: background-color 0.15s ease;
                }
                .benchmark-method {
                    font-weight: 500;
                }
            </style>
        \`;

        html += '<div class="benchmark-table-container">';
        html += '<table class="benchmark-table"><thead><tr>';
        html += '<th>Test Case</th>';
        html += '<th>Method</th>';
        html += '<th>Avg Time (ms)</th>';
        html += '<th>Min Time (ms)</th>';
        html += '<th>Max Time (ms)</th>';
        html += '<th>Updates</th>';
        html += '</tr></thead><tbody>';

        results.forEach(result => {
            html += '<tr>';
            html += \`<td>\${formatTestCase(result.testCase)}</td>\`;
            html += \`<td><span class="benchmark-method">\${formatMethod(result.method)}</span></td>\`;
            html += \`<td>\${result.averageTime.toFixed(3)}</td>\`;
            html += \`<td>\${result.minTime.toFixed(3)}</td>\`;
            html += \`<td>\${result.maxTime.toFixed(3)}</td>\`;
            html += \`<td>\${result.updateCount}</td>\`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        html += '</div>';

        this.resultsElement.innerHTML = html;

        // Add export functionality
        const exportButton = document.getElementById('exportBenchmarkResults');
        if (exportButton) {
            exportButton.addEventListener('click', () => {
                const exportData = {
                    version,
                    config: metadata || {},
                    results: results.map(r => ({
                        testCase: formatTestCase(r.testCase),
                        method: formatMethod(r.method),
                        averageTime: r.averageTime,
                        minTime: r.minTime,
                        maxTime: r.maxTime,
                        updateCount: r.updateCount,
                        timings: r.timings,
                    })),
                };
                const json = JSON.stringify(exportData, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`benchmark-results-\${new Date().toISOString()}.json\`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }

        // Log to console
        console.table(
            results.map(r => ({
                testCase: formatTestCase(r.testCase),
                method: formatMethod(r.method),
                avgMs: r.averageTime.toFixed(3),
                minMs: r.minTime.toFixed(3),
                maxMs: r.maxTime.toFixed(3),
                updates: r.updateCount,
            }))
        );
    }

    setRunButtonHandler(handler) {
        if (this.runButton) {
            this.runButton.addEventListener('click', handler);
        }
    }

    setRunButtonEnabled(enabled) {
        if (this.runButton) {
            this.runButton.disabled = !enabled;
        }
    }
}

/**
 * BenchmarkRunner - Executes benchmark tests based on declarative config
 */
class BenchmarkRunner {
    constructor(config, ui) {
        this.config = config;
        this.ui = ui;
        this.isRunning = false;
        this.results = [];
        this.updateIndex = 0;
        this.totalUpdates = 0;
        this.currentTestCase = null;
        this.currentMethod = null;
        this.version = this.detectVersion();
    }

    detectVersion() {
        // Try to detect AG Charts version from window
        if (typeof agCharts !== 'undefined' && agCharts.VERSION) {
            return agCharts.VERSION;
        }
        // Fallback
        return 'unknown';
    }

    calculateTotalUpdates() {
        let total = 0;
        for (const testCase of this.config.testCases) {
            const availableMethods = testCase.methods.filter(m => m.available !== false);
            total += availableMethods.length * this.config.config.updatesPerTest;
        }
        return total;
    }

    async run() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.results = [];
        this.updateIndex = 0;
        this.totalUpdates = this.calculateTotalUpdates();

        this.ui.hideControls();
        this.ui.show();
        this.ui.setRunButtonEnabled(false);
        this.updateProgress();

        try {
            for (const testCase of this.config.testCases) {
                this.currentTestCase = testCase;

                // Setup the test case
                if (testCase.setup) {
                    await testCase.setup();
                }

                // Run each available method
                const availableMethods = testCase.methods.filter(m => m.available !== false);
                for (const method of availableMethods) {
                    this.currentMethod = method;
                    this.updateProgress();
                    const result = await this.runBenchmarkTest(testCase, method);
                    this.results.push(result);
                }
            }

            this.displayResults();
        } catch (error) {
            console.error('Benchmark error:', error);
            this.ui.showError(\`Benchmark failed: \${error}\`);
        } finally {
            this.isRunning = false;
            this.currentTestCase = null;
            this.currentMethod = null;
            this.ui.setRunButtonEnabled(true);

            // Call onComplete callback
            if (this.config.onComplete) {
                await this.config.onComplete();
            }

            this.ui.showControls();
        }
    }

    async runBenchmarkTest(testCase, method) {
        const timings = [];
        let updateCount = 0;
        let warmupCount = 0;
        let updateInFlight = false;
        let startTime = null;
        let isWarmupComplete = false;

        const { updatesPerTest, maxCollectionTimeMs, warmupUpdates } = this.config.config;

        return new Promise((resolve) => {
            const runFrame = async () => {
                // Warmup phase
                if (!isWarmupComplete) {
                    if (warmupCount >= warmupUpdates) {
                        isWarmupComplete = true;
                        startTime = performance.now();
                    } else {
                        if (!updateInFlight) {
                            updateInFlight = true;
                            try {
                                await method.update();
                                warmupCount++;
                                this.updateIndex++;
                                this.updateProgress();
                            } finally {
                                updateInFlight = false;
                            }
                        }
                        requestAnimationFrame(runFrame);
                        return;
                    }
                }

                // Measurement phase
                const elapsedTime = startTime !== null ? performance.now() - startTime : 0;
                const hasReachedSampleLimit = updateCount >= updatesPerTest;
                const hasReachedTimeLimit = elapsedTime >= maxCollectionTimeMs;

                if (hasReachedSampleLimit || hasReachedTimeLimit) {
                    const averageTime = timings.length > 0 ? timings.reduce((sum, t) => sum + t, 0) / timings.length : 0;
                    const minTime = timings.length > 0 ? Math.min(...timings) : 0;
                    const maxTime = timings.length > 0 ? Math.max(...timings) : 0;

                    resolve({
                        testCase: testCase.id,
                        method: method.id,
                        averageTime,
                        minTime,
                        maxTime,
                        updateCount: timings.length,
                        timings: [...timings],
                    });
                    return;
                }

                if (!updateInFlight) {
                    updateInFlight = true;
                    try {
                        const elapsed = await method.update();
                        if (elapsed > 0) {
                            timings.push(elapsed);
                            updateCount++;
                            this.updateIndex++;
                            this.updateProgress();
                        }
                    } finally {
                        updateInFlight = false;
                    }
                }

                requestAnimationFrame(runFrame);
            };

            requestAnimationFrame(runFrame);
        });
    }

    updateProgress(showExportButton = false) {
        const currentTest = this.currentTestCase
            ? \`\${this.currentTestCase.label || this.currentTestCase.id} (\${this.currentMethod?.label || this.currentMethod?.id || ''})\`
            : 'Initializing...';
        const completedTests = this.results.length;
        let totalTests = 0;
        for (const testCase of this.config.testCases) {
            totalTests += testCase.methods.filter(m => m.available !== false).length;
        }

        this.ui.updateProgress(
            this.isRunning ? 'running' : 'complete',
            currentTest,
            completedTests,
            totalTests,
            this.updateIndex,
            this.totalUpdates,
            this.version,
            this.config.warnings || [],
            showExportButton
        );
    }

    displayResults() {
        this.updateProgress(true);
        this.ui.displayResults(
            this.results,
            (testCase) => {
                const tc = this.config.testCases.find(t => t.id === testCase);
                return tc?.label || testCase;
            },
            (method) => {
                for (const tc of this.config.testCases) {
                    const m = tc.methods.find(m => m.id === method);
                    if (m) return m.label || method;
                }
                return method;
            },
            this.version,
            this.config.metadata
        );
    }
}

/**
 * Initialize benchmark system
 * This is called by the loader snippet after dynamic import
 */
export function initBenchmark(config) {
    if (!config || !config.testCases || config.testCases.length === 0) {
        console.warn('initBenchmark: Invalid or empty config provided');
        return;
    }

    const ui = new BenchmarkUI();
    ui.init();

    const runner = new BenchmarkRunner(config, ui);

    // Set up run button handler
    ui.setRunButtonHandler(() => {
        runner.run();
    });

    // Check for auto-run URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('benchmark') === 'true') {
        setTimeout(() => {
            runner.run();
        }, 1000);
    }

    // Expose runner on window for debugging
    window.__benchmarkRunner = runner;
}
`;
