/**
 * Generic benchmark module for AG Charts examples
 * Can be reused across different chart types and test scenarios
 */

export interface BenchmarkResult<TTestCase = any> {
    testCase: TTestCase;
    method: string;
    averageTime: number;
    minTime: number;
    maxTime: number;
    updateCount: number;
    timings: number[];
}

export interface BenchmarkConfig<TTestCase = any> {
    testCases: TTestCase[];
    updatesPerTest: number;
    maxCollectionTimeMs: number;
    warmupUpdates: number;
    version: string;
    versionWarnings?: string[];
    metadata?: Record<string, any>;
}

export interface BenchmarkCallbacks<TTestCase = any> {
    /**
     * Setup the chart for a specific test case (e.g., switch series type)
     */
    setupTestCase: (testCase: TTestCase) => Promise<void>;

    /**
     * Perform a single update and return elapsed time in milliseconds
     */
    performUpdate: (testCase: TTestCase, method: string) => Promise<number>;

    /**
     * Get available methods for a test case (e.g., ['applyTransaction', 'updateDelta'])
     */
    getMethods: (testCase: TTestCase) => string[];

    /**
     * Format test case name for display
     */
    formatTestCase: (testCase: TTestCase) => string;

    /**
     * Format method name for display
     */
    formatMethod: (method: string) => string;

    /**
     * Called when benchmark completes or is stopped
     */
    onComplete?: () => Promise<void>;
}

interface BenchmarkState<TTestCase> {
    isRunning: boolean;
    currentTestCase?: TTestCase;
    currentMethod?: string;
    results: BenchmarkResult<TTestCase>[];
    updateIndex: number;
    totalUpdates: number;
}

export class BenchmarkRunner<TTestCase = any> {
    private config: BenchmarkConfig<TTestCase>;
    private callbacks: BenchmarkCallbacks<TTestCase>;
    private state: BenchmarkState<TTestCase>;

    constructor(config: BenchmarkConfig<TTestCase>, callbacks: BenchmarkCallbacks<TTestCase>) {
        this.config = config;
        this.callbacks = callbacks;
        this.state = {
            isRunning: false,
            results: [],
            updateIndex: 0,
            totalUpdates: 0,
        };
    }

    async run(): Promise<void> {
        if (this.state.isRunning) {
            return;
        }

        this.state.isRunning = true;
        this.state.results = [];
        this.state.updateIndex = 0;

        // Calculate total updates
        let totalTests = 0;
        for (const testCase of this.config.testCases) {
            totalTests += this.callbacks.getMethods(testCase).length;
        }
        this.state.totalUpdates = totalTests * this.config.updatesPerTest;

        this.showBenchmarkUI();
        this.updateBenchmarkProgress();

        try {
            for (const testCase of this.config.testCases) {
                this.state.currentTestCase = testCase;

                // Setup the chart for this test case
                await this.callbacks.setupTestCase(testCase);

                // Run benchmark for each method
                const methods = this.callbacks.getMethods(testCase);
                for (const method of methods) {
                    this.state.currentMethod = method;
                    this.updateBenchmarkProgress();
                    const result = await this.runBenchmarkTest(testCase, method);
                    this.state.results.push(result);
                }
            }

            this.displayBenchmarkResults();
        } catch (error) {
            console.error('Benchmark error:', error);
            const errorElement = document.getElementById('benchmarkError');
            if (errorElement) {
                errorElement.textContent = `Benchmark failed: ${error}`;
                errorElement.style.display = 'block';
            }
        } finally {
            this.state.isRunning = false;
            this.state.currentTestCase = undefined;
            this.state.currentMethod = undefined;

            // Call onComplete callback to restore form state
            if (this.callbacks.onComplete) {
                await this.callbacks.onComplete();
            }
        }
    }

    private async runBenchmarkTest(testCase: TTestCase, method: string): Promise<BenchmarkResult<TTestCase>> {
        const timings: number[] = [];
        let benchmarkRafId: number | undefined;
        let updateCount = 0;
        let warmupCount = 0;
        let benchmarkUpdateInFlight = false;
        let startTime: number | undefined;
        let isWarmupComplete = false;

        return new Promise<BenchmarkResult<TTestCase>>((resolve) => {
            const runFrame = async () => {
                // Warmup phase: perform updates without collecting timings
                if (!isWarmupComplete) {
                    if (warmupCount >= this.config.warmupUpdates) {
                        isWarmupComplete = true;
                        startTime = performance.now(); // Start timing after warmup
                    } else {
                        if (!benchmarkUpdateInFlight) {
                            benchmarkUpdateInFlight = true;
                            try {
                                await this.callbacks.performUpdate(testCase, method);
                                warmupCount++;
                                this.state.updateIndex += 1;
                                this.updateBenchmarkProgress();
                            } finally {
                                benchmarkUpdateInFlight = false;
                            }
                        }
                        benchmarkRafId = requestAnimationFrame(runFrame);
                        return;
                    }
                }

                // Measurement phase: collect timings
                const elapsedTime = startTime !== undefined ? performance.now() - startTime : 0;
                const hasReachedSampleLimit = updateCount >= this.config.updatesPerTest;
                const hasReachedTimeLimit = elapsedTime >= this.config.maxCollectionTimeMs;

                if (hasReachedSampleLimit || hasReachedTimeLimit) {
                    if (benchmarkRafId !== undefined) {
                        cancelAnimationFrame(benchmarkRafId);
                    }
                    const averageTime =
                        timings.length > 0 ? timings.reduce((sum, t) => sum + t, 0) / timings.length : 0;
                    const minTime = timings.length > 0 ? Math.min(...timings) : 0;
                    const maxTime = timings.length > 0 ? Math.max(...timings) : 0;
                    resolve({
                        testCase,
                        method,
                        averageTime,
                        minTime,
                        maxTime,
                        updateCount: timings.length,
                        timings: [...timings],
                    });
                    return;
                }

                if (!benchmarkUpdateInFlight) {
                    benchmarkUpdateInFlight = true;
                    try {
                        const elapsed = await this.callbacks.performUpdate(testCase, method);
                        if (elapsed > 0) {
                            timings.push(elapsed);
                            updateCount++;
                            this.state.updateIndex += 1;
                            this.updateBenchmarkProgress();
                        }
                    } finally {
                        benchmarkUpdateInFlight = false;
                    }
                }

                benchmarkRafId = requestAnimationFrame(runFrame);
            };

            benchmarkRafId = requestAnimationFrame(runFrame);
        });
    }

    private showBenchmarkUI() {
        const controlsRow = document.querySelector('.controls-row');
        if (controlsRow) {
            (controlsRow as HTMLElement).style.display = 'none';
        }
        const benchmarkContainer = document.getElementById('benchmarkContainer');
        if (benchmarkContainer) {
            benchmarkContainer.style.display = 'block';
            benchmarkContainer.style.backgroundColor = '#ffffff';
            benchmarkContainer.style.border = '1px solid #dee2e6';
            benchmarkContainer.style.borderRadius = '8px';
            benchmarkContainer.style.padding = '16px';
            benchmarkContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        }
    }

    private updateBenchmarkProgress() {
        const progressElement = document.getElementById('benchmarkProgress');
        if (progressElement) {
            const currentTest = this.state.currentTestCase
                ? `${this.callbacks.formatTestCase(this.state.currentTestCase)} (${this.callbacks.formatMethod(this.state.currentMethod || '')})`
                : 'Initializing...';
            const completedTests = this.state.results.length;
            let totalTests = 0;
            for (const testCase of this.config.testCases) {
                totalTests += this.callbacks.getMethods(testCase).length;
            }
            const testProgress = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
            const updateProgress =
                this.state.totalUpdates > 0 ? Math.round((this.state.updateIndex / this.state.totalUpdates) * 100) : 0;

            // Status badge: grey while running, green when complete
            const statusColor = this.state.isRunning ? '#6c757d' : '#28a745';
            const statusText = this.state.isRunning ? 'Running' : 'Complete';

            // Build warnings badges if any
            let warningsBadges = '';
            if (this.config.versionWarnings && this.config.versionWarnings.length > 0) {
                warningsBadges = this.config.versionWarnings
                    .map(
                        (warning) =>
                            `<span style="background: #fff3cd; color: #856404; padding: 4px 10px; border-radius: 12px; border: 1px solid #ffeaa7; font-size: 11px; font-weight: 500; white-space: nowrap;">⚠️ ${warning}</span>`
                    )
                    .join('');
            }

            progressElement.style.padding = '0';
            progressElement.style.backgroundColor = 'transparent';
            progressElement.style.border = 'none';
            progressElement.style.borderRadius = '0';
            progressElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
            progressElement.innerHTML = `
                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between;">
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                        <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${statusText}
                        </span>
                        <span style="background: #0066cc; color: white; padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; white-space: nowrap;">
                            ${currentTest}
                        </span>
                        <span style="background: white; color: #495057; padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; border: 1px solid #dee2e6; white-space: nowrap;">
                            Tests: ${completedTests}/${totalTests} <strong style="color: #0066cc;">${testProgress}%</strong>
                        </span>
                        <span style="background: white; color: #495057; padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; border: 1px solid #dee2e6; white-space: nowrap;">
                            Updates: ${this.state.updateIndex}/${this.state.totalUpdates} <strong style="color: #0066cc;">${updateProgress}%</strong>
                        </span>
                        ${warningsBadges}
                    </div>
                    <span style="background: #e7f1ff; color: #0066cc; padding: 4px 12px; border-radius: 12px; border: 1px solid #b3d9ff; font-size: 12px; font-weight: 500; white-space: nowrap;">
                        v${this.config.version}
                    </span>
                </div>
            `;
        }
    }

    private displayBenchmarkResults() {
        // Update progress one final time to show "Complete" status
        this.updateBenchmarkProgress();

        const resultsElement = document.getElementById('benchmarkResults');
        if (!resultsElement) return;

        // Create results table with clean styling
        let html = `
            <style>
                .benchmark-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .benchmark-table thead {
                    background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);
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
                .export-button {
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: linear-gradient(to bottom, #0066cc 0%, #0052a3 100%);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: all 0.2s ease;
                }
                .export-button:hover {
                    background: linear-gradient(to bottom, #0052a3 0%, #003d7a 100%);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                    transform: translateY(-1px);
                }
                .export-button:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
            </style>
        `;

        html += '<table class="benchmark-table"><thead><tr>';
        html += '<th>Test Case</th>';
        html += '<th>Method</th>';
        html += '<th>Avg Time (ms)</th>';
        html += '<th>Min Time (ms)</th>';
        html += '<th>Max Time (ms)</th>';
        html += '<th>Updates</th>';
        html += '</tr></thead><tbody>';

        this.state.results.forEach((result) => {
            html += '<tr>';
            html += `<td>${this.callbacks.formatTestCase(result.testCase)}</td>`;
            html += `<td><span class="benchmark-method">${this.callbacks.formatMethod(result.method)}</span></td>`;
            html += `<td>${result.averageTime.toFixed(3)}</td>`;
            html += `<td>${result.minTime.toFixed(3)}</td>`;
            html += `<td>${result.maxTime.toFixed(3)}</td>`;
            html += `<td>${result.updateCount}</td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';

        // Add JSON export button
        html += '<button id="exportBenchmarkResults" class="export-button">Export Results as JSON</button>';

        resultsElement.innerHTML = html;

        // Add export functionality
        const exportButton = document.getElementById('exportBenchmarkResults');
        if (exportButton) {
            exportButton.addEventListener('click', () => {
                this.exportResults();
            });
        }

        // Log to console as well
        console.table(
            this.state.results.map((r) => ({
                testCase: this.callbacks.formatTestCase(r.testCase),
                method: this.callbacks.formatMethod(r.method),
                avgMs: r.averageTime.toFixed(3),
                minMs: r.minTime.toFixed(3),
                maxMs: r.maxTime.toFixed(3),
                updates: r.updateCount,
            }))
        );
    }

    exportResults(): void {
        const exportData = {
            version: this.config.version,
            config: this.config.metadata || {},
            results: this.state.results.map((r) => ({
                testCase: this.callbacks.formatTestCase(r.testCase),
                method: this.callbacks.formatMethod(r.method),
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
        a.download = `benchmark-results-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
