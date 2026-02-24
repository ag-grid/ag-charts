/* eslint-disable no-console */
/**
 * Full benchmark harness implementation that gets compiled to benchmarkHarness.js
 * and included in generated examples that define getBenchmarkConfig().
 *
 * This file is compiled by the normal Nx build and read at runtime.
 */
import { isVersionInRange } from './benchmarkUtils';

// Type declarations for the benchmark system
declare const agCharts: { VERSION?: string } | undefined;

/**
 * A benchmark variant represents one permutation to test within a test case.
 * The `params` object defines arbitrary key-value pairs that describe this variant.
 */
interface BenchmarkVariant {
    params?: Record<string, string>;
    available?: boolean;
    minVersion?: string; // e.g., "12.3.0"
    maxVersion?: string; // e.g., "13.0.0"
    run: () => Promise<number>;
}

interface BenchmarkTestCase {
    id: string;
    label?: string;
    minVersion?: string; // e.g., "12.3.0"
    maxVersion?: string; // e.g., "13.0.0"
    setup?: () => Promise<void> | void;
    teardown?: () => Promise<void> | void;
    variants: BenchmarkVariant[];
}

interface BenchmarkConfigSettings {
    updatesPerTest: number;
    maxCollectionTimeMs: number;
    warmupUpdates: number;
}

export interface BenchmarkConfig {
    testCases: BenchmarkTestCase[];
    config: BenchmarkConfigSettings;
    warnings?: string[];
    metadata?: Record<string, unknown>;
    onComplete?: () => Promise<void>;
}

interface BenchmarkResult {
    testCase: string;
    params: Record<string, string>;
    averageTime: number;
    minTime: number;
    maxTime: number;
    sampleCount: number;
    timings: number[];
}

// Internal normalized variant (always has params)
interface NormalizedVariant {
    params: Record<string, string>;
    available: boolean;
    run: () => Promise<number>;
}

interface NormalizedTestCase {
    id: string;
    label?: string;
    setup?: () => Promise<void> | void;
    teardown?: () => Promise<void> | void;
    variants: NormalizedVariant[];
}

interface NormalizedConfig {
    testCases: NormalizedTestCase[];
    config: BenchmarkConfigSettings;
    warnings: string[];
    metadata?: Record<string, unknown>;
    onComplete?: () => Promise<void>;
}

/**
 * Format params for display (e.g., in progress indicator)
 */
function formatParams(params: Record<string, string>): string {
    const keys = Object.keys(params);
    if (keys.length === 0) return '';
    return keys.map((k) => `${k}: ${params[k]}`).join(', ');
}

/**
 * Normalize config to internal format
 */
function normalizeConfig(config: BenchmarkConfig): NormalizedConfig {
    const warnings = [...(config.warnings || [])];

    // Detect current AG Charts version - prefer metadata.version (passed from ES modules),
    // fall back to global agCharts.VERSION (UMD builds), then 'unknown'
    const currentVersion = (config.metadata?.version as string) || agCharts?.VERSION || 'unknown';

    const testCases: NormalizedTestCase[] = [];

    for (const tc of config.testCases) {
        // Check if test case meets version constraints
        const testCaseVersionOk = isVersionInRange(currentVersion, tc.minVersion, tc.maxVersion);

        if (!testCaseVersionOk) {
            // Skip entire test case if version doesn't match
            const constraint = tc.minVersion
                ? tc.maxVersion
                    ? `${tc.minVersion} - ${tc.maxVersion}`
                    : `>= ${tc.minVersion}`
                : `< ${tc.maxVersion}`;
            warnings.push(`Skipped "${tc.label || tc.id}" (requires ${constraint})`);
            continue;
        }

        const variants: NormalizedVariant[] = [];

        for (const v of tc.variants) {
            // Check if variant meets version constraints
            const variantVersionOk = isVersionInRange(currentVersion, v.minVersion, v.maxVersion);

            if (!variantVersionOk) {
                // Mark variant as unavailable if version doesn't match
                const constraint = v.minVersion
                    ? v.maxVersion
                        ? `${v.minVersion} - ${v.maxVersion}`
                        : `>= ${v.minVersion}`
                    : `< ${v.maxVersion}`;
                const paramDesc = v.params ? ` (${formatParams(v.params)})` : '';
                warnings.push(`Skipped "${tc.label || tc.id}${paramDesc}" (requires ${constraint})`);
            }

            variants.push({
                params: v.params || {},
                available: v.available !== false && variantVersionOk,
                run: v.run,
            });
        }

        testCases.push({
            id: tc.id,
            label: tc.label,
            setup: tc.setup,
            teardown: tc.teardown,
            variants,
        });
    }

    return {
        testCases,
        config: config.config,
        warnings,
        metadata: config.metadata,
        onComplete: config.onComplete,
    };
}

/**
 * CSS custom properties for theme-aware benchmark styling.
 * Uses `[data-dark-mode="true"]` selector to automatically switch themes.
 */
const BENCHMARK_THEME_CSS = `
    :root {
        /* Colors aligned with ag-website-shared design system */
        --bm-container-bg: #ffffff;  /* white */
        --bm-container-border: #d0d5dd;  /* gray-300 */
        --bm-container-shadow: rgba(12,17,29,0.08);  /* gray-950 based */
        --bm-error-text: #dc3545;  /* negative */
        --bm-error-bg: #fef0c7;  /* warning-100 */
        --bm-status-running: #667085;  /* gray-500 */
        --bm-status-complete: #28a745;  /* success/positive */
        --bm-warning-bg: #fffaeb;  /* warning-50 */
        --bm-warning-text: #b54708;  /* warning-700 */
        --bm-warning-border: #fedf89;  /* warning-200 */
        --bm-primary-bg: #0e4491;  /* brand-500 */
        --bm-primary-bg-end: #00388f;  /* brand-700 */
        --bm-badge-bg: #ffffff;  /* white */
        --bm-badge-text: #475467;  /* gray-600 */
        --bm-badge-border: #d0d5dd;  /* gray-300 */
        --bm-badge-accent: #0e4491;  /* brand-500 */
        --bm-version-bg: #e5effd;  /* brand-100 */
        --bm-version-text: #0e4491;  /* brand-500 */
        --bm-version-border: #a9c5ec;  /* brand-300 */
        --bm-table-header-start: #f9fafb;  /* gray-50 */
        --bm-table-header-end: #f2f4f7;  /* gray-100 */
        --bm-table-header-text: #475467;  /* gray-600 */
        --bm-table-border: #eaecf0;  /* gray-200 */
        --bm-table-text: #101828;  /* gray-900 */
        --bm-table-row-alt: #f9fafb;  /* gray-50 */
        --bm-table-row-hover: #e5effd;  /* brand-100 */
        --bm-run-button-bg: #28a745;  /* success/positive */
        --bm-overlay-bg: rgba(255, 255, 255, 0.8);  /* semi-transparent white */
    }

    [data-dark-mode="true"] {
        /* Colors aligned with ag-website-shared design system - muted for dark mode */
        --bm-container-bg: #141d2c;  /* mix of gray-800 #182230 and gray-900 #101828 */
        --bm-container-border: #344054;  /* gray-700 */
        --bm-container-shadow: rgba(0,0,0,0.3);
        --bm-error-text: #f87171;
        --bm-error-bg: #450a0a;
        --bm-status-running: #667085;  /* gray-500 - muted */
        --bm-status-complete: #28a745;  /* standard success - not too bright */
        --bm-warning-bg: #4e1d09;  /* warning-950 */
        --bm-warning-text: #fdb022;  /* warning-400 */
        --bm-warning-border: #93370d;  /* warning-800 */
        --bm-primary-bg: #3d7acd;  /* brand-400 - darker than brand-300 */
        --bm-primary-bg-end: #0e4491;  /* brand-500 */
        --bm-badge-bg: #182230;  /* gray-800 */
        --bm-badge-text: #98a2b3;  /* gray-400 - slightly muted */
        --bm-badge-border: #344054;  /* gray-700 */
        --bm-badge-accent: #3d7acd;  /* brand-400 */
        --bm-version-bg: #001a5a;  /* brand-950 - darker */
        --bm-version-text: #a9c5ec;  /* brand-300 - muted */
        --bm-version-border: #00246c;  /* brand-900 */
        --bm-table-header-start: #182230;  /* gray-800 */
        --bm-table-header-end: #101828;  /* gray-900 */
        --bm-table-header-text: #98a2b3;  /* gray-400 */
        --bm-table-border: #344054;  /* gray-700 */
        --bm-table-text: #d0d5dd;  /* gray-300 - not pure white */
        --bm-table-row-alt: #182230;  /* gray-800 */
        --bm-table-row-hover: #002e7e;  /* brand-800 */
        --bm-run-button-bg: #28a745;  /* standard success - not too bright */
        --bm-overlay-bg: rgba(20, 29, 44, 0.8);  /* semi-transparent dark */
    }
`;

let themeStylesInjected = false;

/**
 * Inject theme CSS custom properties into the document
 */
function injectThemeStyles(): void {
    if (themeStylesInjected) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'benchmark-theme-styles';
    styleElement.textContent = BENCHMARK_THEME_CSS;
    document.head.appendChild(styleElement);
    themeStylesInjected = true;
}

/**
 * BenchmarkUI - Self-contained UI management for benchmarks
 * Creates all necessary DOM elements dynamically
 */
class BenchmarkUI {
    container: HTMLDivElement | null = null;
    progressElement: HTMLDivElement | null = null;
    resultsElement: HTMLDivElement | null = null;
    errorElement: HTMLDivElement | null = null;
    runButton: HTMLButtonElement | null = null;
    panelCollapsed: boolean = false;
    panelToggleButton: HTMLButtonElement | null = null;
    panelContent: HTMLDivElement | null = null;
    isFloatingMode: boolean = false;

    /**
     * Initialize the benchmark UI by creating DOM elements
     */
    init(): void {
        injectThemeStyles();
        this.createBenchmarkContainer();
        this.injectRunButton();
    }

    /**
     * Gets the chart parent element and ensures it has position: relative for absolute positioning.
     * Returns the parent element, or null if chart element not found.
     */
    private getChartParentWithPositioning(): HTMLElement | null {
        const chartElement = document.getElementById('myChart');
        if (!chartElement) {
            console.warn('Chart element not found');
            return null;
        }

        const chartParent = chartElement.parentElement;
        if (chartParent) {
            const computedStyle = window.getComputedStyle(chartParent);
            if (computedStyle.position === 'static') {
                chartParent.style.position = 'relative';
            }
        }
        return chartParent;
    }

    createBenchmarkContainer(): void {
        const chartParent = this.getChartParentWithPositioning();
        if (!chartParent) {
            return;
        }

        // Create main container (floating at bottom)
        this.container = document.createElement('div');
        this.container.id = 'benchmarkContainer';
        this.container.style.cssText =
            'display: none; position: absolute; bottom: 0; left: 0; right: 0; z-index: 99; background-color: var(--bm-overlay-bg); backdrop-filter: blur(4px); border-radius: 8px 8px 0 0;';

        // Toggle button (always visible at bottom edge)
        this.panelToggleButton = document.createElement('button');
        this.panelToggleButton.id = 'benchmarkPanelToggle';
        this.panelToggleButton.textContent = '▼ Hide Panel';
        this.panelToggleButton.style.cssText =
            'display: block; width: 100%; background-color: color-mix(in srgb, var(--bm-primary-bg) 85%, transparent); color: white; border: none; padding: 8px 20px; cursor: pointer; border-radius: 8px 8px 0 0; font-weight: 500; font-size: 12px; text-align: center;';
        this.panelToggleButton.addEventListener('click', () => this.togglePanelCollapsed());
        this.container.appendChild(this.panelToggleButton);

        // Collapsible content wrapper
        this.panelContent = document.createElement('div');
        this.panelContent.id = 'benchmarkPanelContent';
        this.panelContent.style.cssText = 'max-height: 60vh; overflow-y: auto;';
        this.container.appendChild(this.panelContent);

        // Progress element (status bar)
        this.progressElement = document.createElement('div');
        this.progressElement.id = 'benchmarkProgress';
        this.progressElement.style.cssText = 'padding: 12px 16px;';
        this.progressElement.textContent = 'Initializing...';
        this.panelContent.appendChild(this.progressElement);

        // Error element
        this.errorElement = document.createElement('div');
        this.errorElement.id = 'benchmarkError';
        this.errorElement.style.cssText =
            'display: none; color: var(--bm-error-text); margin: 0 16px 10px; padding: 10px; background: var(--bm-error-bg); border-radius: 4px;';
        this.panelContent.appendChild(this.errorElement);

        // Results element
        this.resultsElement = document.createElement('div');
        this.resultsElement.id = 'benchmarkResults';
        this.panelContent.appendChild(this.resultsElement);

        // Insert container relative to chart element
        chartParent.appendChild(this.container);
    }

    injectRunButton(): void {
        // Find or create controls container
        let controlsRow = document.querySelector('.controls-row');
        if (!controlsRow) {
            const exampleControls = document.querySelector('.example-controls');
            if (exampleControls) {
                controlsRow = document.createElement('div');
                controlsRow.className = 'controls-row';
                exampleControls.appendChild(controlsRow);
            } else {
                // No example-controls exists - create floating button instead
                this.isFloatingMode = true;
                this.createFloatingButton();
                return;
            }
        }

        // Create run benchmark button (non-floating mode)
        this.runButton = document.createElement('button');
        this.runButton.id = 'runBenchmarkBtn';
        this.runButton.textContent = 'Run Benchmark';
        this.runButton.style.cssText =
            'margin-left: auto; background-color: var(--bm-run-button-bg); color: white; border: none; padding: 5px 15px; cursor: pointer; border-radius: 4px;';
        controlsRow.appendChild(this.runButton);
    }

    private createFloatingButton(): void {
        const chartParent = this.getChartParentWithPositioning();

        // Create floating button
        this.runButton = document.createElement('button');
        this.runButton.id = 'runBenchmarkBtn';
        this.runButton.textContent = 'Run Benchmark';
        this.runButton.style.cssText =
            'position: absolute; top: 10px; right: 10px; z-index: 100; background-color: var(--bm-run-button-bg); color: white; border: none; padding: 8px 16px; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-weight: 500;';

        // Insert button relative to chart element
        if (chartParent) {
            chartParent.appendChild(this.runButton);
        } else {
            document.body.appendChild(this.runButton);
        }
    }

    show(): void {
        if (this.container) {
            this.container.style.display = 'block';
        }
        // Ensure panel is expanded when showing
        this.panelCollapsed = false;
        this.updatePanelVisibility();
    }

    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    hideControls(): void {
        // Only hide the run button, not the entire controls row
        // This preserves the original example controls
        if (this.runButton) {
            this.runButton.style.display = 'none';
        }
    }

    showControls(): void {
        // Show the run button
        if (this.runButton) {
            this.runButton.style.display = this.isFloatingMode ? 'block' : '';
        }
    }

    showError(message: string): void {
        if (this.errorElement) {
            this.errorElement.textContent = message;
            this.errorElement.style.display = 'block';
        }
    }

    updateProgress(
        status: 'running' | 'complete',
        currentTest: string,
        completedTests: number,
        totalTests: number,
        updateIndex: number,
        totalUpdates: number,
        version: string,
        warnings: string[],
        showExportButton = false
    ): void {
        if (!this.progressElement) return;

        const statusColor = status === 'running' ? 'var(--bm-status-running)' : 'var(--bm-status-complete)';
        const statusText = status === 'running' ? 'Running' : 'Complete';
        const testProgress = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
        const updateProgress = totalUpdates > 0 ? Math.round((updateIndex / totalUpdates) * 100) : 0;

        let warningsBadges = '';
        if (warnings && warnings.length > 0) {
            warningsBadges = warnings
                .map(
                    (warning) =>
                        `<span style="background: var(--bm-warning-bg); color: var(--bm-warning-text); padding: 4px 10px; border-radius: 12px; border: 1px solid var(--bm-warning-border); font-size: 11px; font-weight: 500; white-space: nowrap;">⚠️ ${warning}</span>`
                )
                .join('');
        }

        const exportButton = showExportButton
            ? `<button id="exportBenchmarkResults" style="background: linear-gradient(to bottom, var(--bm-primary-bg) 0%, var(--bm-primary-bg-end) 100%); color: white; border: none; border-radius: 4px; padding: 4px 12px; font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap;">Export JSON</button>`
            : '';

        this.progressElement.style.cssText =
            'padding: 12px 16px; background-color: transparent; border: none; border-radius: 0; font-family: system-ui, -apple-system, sans-serif;';
        this.progressElement.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between;">
                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                    <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${statusText}
                    </span>
                    <span style="background: var(--bm-primary-bg); color: white; padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; white-space: nowrap;">
                        ${currentTest}
                    </span>
                    <span style="background: var(--bm-badge-bg); color: var(--bm-badge-text); padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; border: 1px solid var(--bm-badge-border); white-space: nowrap;">
                        Tests: ${completedTests}/${totalTests} <strong style="color: var(--bm-badge-accent);">${testProgress}%</strong>
                    </span>
                    <span style="background: var(--bm-badge-bg); color: var(--bm-badge-text); padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; border: 1px solid var(--bm-badge-border); white-space: nowrap;">
                        Runs: ${updateIndex}/${totalUpdates} <strong style="color: var(--bm-badge-accent);">${updateProgress}%</strong>
                    </span>
                    ${warningsBadges}
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="background: var(--bm-version-bg); color: var(--bm-version-text); padding: 4px 12px; border-radius: 12px; border: 1px solid var(--bm-version-border); font-size: 12px; font-weight: 500; white-space: nowrap;">
                        v${version}
                    </span>
                    ${exportButton}
                </div>
            </div>
        `;
    }

    displayResults(
        results: BenchmarkResult[],
        formatTestCase: (testCase: string) => string,
        _version: string,
        _metadata?: Record<string, unknown>,
        onExport?: () => void
    ): void {
        if (!this.resultsElement) return;

        // Calculate which columns need right-alignment (numeric columns start after Parameters)
        const firstNumericCol = 3; // Test Case + Parameters + first numeric (Avg Time)

        let html = `
            <style>
                .benchmark-table-container {
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid var(--bm-table-border);
                    border-radius: 4px;
                    margin: 0 16px 16px 16px;
                }
                .benchmark-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                }
                .benchmark-table thead {
                    background: linear-gradient(to bottom, var(--bm-table-header-start) 0%, var(--bm-table-header-end) 100%);
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                .benchmark-table th {
                    padding: 12px 16px;
                    text-align: left;
                    font-weight: 600;
                    color: var(--bm-table-header-text);
                    border: 1px solid var(--bm-table-border);
                    text-transform: uppercase;
                    font-size: 12px;
                    letter-spacing: 0.5px;
                }
                .benchmark-table th:nth-child(n+${firstNumericCol}) {
                    text-align: right;
                }
                .benchmark-table td {
                    padding: 10px 16px;
                    border: 1px solid var(--bm-table-border);
                    color: var(--bm-table-text);
                }
                .benchmark-table td:nth-child(n+${firstNumericCol}) {
                    text-align: right;
                    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                    font-size: 13px;
                }
                .benchmark-table tbody tr:nth-child(even) {
                    background-color: var(--bm-table-row-alt);
                }
                .benchmark-table tbody tr:hover {
                    background-color: var(--bm-table-row-hover);
                    transition: background-color 0.15s ease;
                }
                .benchmark-param {
                    font-weight: 500;
                }
            </style>
        `;

        html += '<div class="benchmark-table-container">';
        html += '<table class="benchmark-table"><thead><tr>';
        html += '<th>Test Case</th>';
        html += '<th>Parameters</th>';
        html += '<th>Avg Time (ms)</th>';
        html += '<th>Min Time (ms)</th>';
        html += '<th>Max Time (ms)</th>';
        html += '<th>Samples</th>';
        html += '</tr></thead><tbody>';

        results.forEach((result) => {
            html += '<tr>';
            html += `<td>${formatTestCase(result.testCase)}</td>`;
            html += `<td><span class="benchmark-param">${formatParams(result.params)}</span></td>`;
            html += `<td>${result.averageTime.toFixed(3)}</td>`;
            html += `<td>${result.minTime.toFixed(3)}</td>`;
            html += `<td>${result.maxTime.toFixed(3)}</td>`;
            html += `<td>${result.sampleCount}</td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        html += '</div>';

        this.resultsElement.innerHTML = html;

        // Add export functionality
        const exportButton = document.getElementById('exportBenchmarkResults');
        if (exportButton && onExport) {
            exportButton.addEventListener('click', onExport);
        }

        // Log to console
        const consoleData = results.map((r) => ({
            testCase: formatTestCase(r.testCase),
            params: formatParams(r.params),
            avgMs: r.averageTime.toFixed(3),
            minMs: r.minTime.toFixed(3),
            maxMs: r.maxTime.toFixed(3),
            samples: r.sampleCount,
        }));
        console.table(consoleData);
    }

    setRunButtonHandler(handler: () => void): void {
        if (this.runButton) {
            this.runButton.addEventListener('click', handler);
        }
    }

    setRunButtonEnabled(enabled: boolean): void {
        if (this.runButton) {
            this.runButton.disabled = !enabled;
        }
    }

    togglePanelCollapsed(): void {
        this.panelCollapsed = !this.panelCollapsed;
        this.updatePanelVisibility();
    }

    private updatePanelVisibility(): void {
        if (!this.panelContent || !this.panelToggleButton) return;

        if (this.panelCollapsed) {
            this.panelContent.style.display = 'none';
            this.panelToggleButton.textContent = '▲ Show Panel';
        } else {
            this.panelContent.style.display = 'block';
            this.panelToggleButton.textContent = '▼ Hide Panel';
        }
    }
}

/**
 * BenchmarkRunner - Executes benchmark tests based on declarative config
 */
class BenchmarkRunner {
    private readonly config: NormalizedConfig;
    private readonly ui: BenchmarkUI;
    private isRunning = false;
    private results: BenchmarkResult[] = [];
    private updateIndex = 0;
    private totalUpdates = 0;
    private currentTestCase: NormalizedTestCase | null = null;
    private currentVariant: NormalizedVariant | null = null;
    private readonly version: string;

    constructor(config: NormalizedConfig, ui: BenchmarkUI) {
        this.config = config;
        this.ui = ui;
        this.version = this.detectVersion();
    }

    private detectVersion(): string {
        // Try to detect AG Charts version from window
        if (agCharts?.VERSION) {
            return agCharts.VERSION;
        }
        // Fallback
        return 'unknown';
    }

    private calculateTotalUpdates(): number {
        let total = 0;
        for (const testCase of this.config.testCases) {
            const availableVariants = testCase.variants.filter((v) => v.available);
            total += availableVariants.length * this.config.config.updatesPerTest;
        }
        return total;
    }

    async run(): Promise<void> {
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

                // Run each available variant
                const availableVariants = testCase.variants.filter((v) => v.available);
                for (const variant of availableVariants) {
                    this.currentVariant = variant;
                    this.updateProgress();
                    const result = await this.runBenchmarkTest(testCase, variant);
                    this.results.push(result);
                }

                if (testCase.teardown) {
                    await testCase.teardown();
                }
            }

            this.displayResults();
            (window as any).__benchmarkResults = this.buildExportData();
        } catch (error) {
            console.error('Benchmark error:', error);
            this.ui.showError(`Benchmark failed: ${error}`);
            (window as any).__benchmarkError = String(error);
        } finally {
            this.isRunning = false;
            (window as any).__benchmarkComplete = true;
            this.currentTestCase = null;
            this.currentVariant = null;
            this.ui.setRunButtonEnabled(true);

            // Call onComplete callback
            if (this.config.onComplete) {
                await this.config.onComplete();
            }

            this.ui.showControls();
        }
    }

    private async runBenchmarkTest(testCase: NormalizedTestCase, variant: NormalizedVariant): Promise<BenchmarkResult> {
        const timings: number[] = [];
        let updateCount = 0;
        let warmupCount = 0;
        let updateInFlight = false;
        let startTime: number | null = null;
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
                                await variant.run();
                                warmupCount++;
                            } finally {
                                updateInFlight = false;
                            }
                        }
                        requestAnimationFrame(() => void runFrame());
                        return;
                    }
                }

                // Measurement phase
                const elapsedTime = startTime === null ? 0 : performance.now() - startTime;
                const hasReachedSampleLimit = updateCount >= updatesPerTest;
                const hasReachedTimeLimit = elapsedTime >= maxCollectionTimeMs;

                if (hasReachedSampleLimit || hasReachedTimeLimit) {
                    const averageTime =
                        timings.length > 0 ? timings.reduce((sum, t) => sum + t, 0) / timings.length : 0;
                    const minTime = timings.length > 0 ? Math.min(...timings) : 0;
                    const maxTime = timings.length > 0 ? Math.max(...timings) : 0;

                    resolve({
                        testCase: testCase.id,
                        params: { ...variant.params },
                        averageTime,
                        minTime,
                        maxTime,
                        sampleCount: timings.length,
                        timings: [...timings],
                    });
                    return;
                }

                if (!updateInFlight) {
                    updateInFlight = true;
                    try {
                        const elapsed = await variant.run();
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

                requestAnimationFrame(() => void runFrame());
            };

            requestAnimationFrame(() => void runFrame());
        });
    }

    private updateProgress(showExportButton = false): void {
        const variantDisplay = this.currentVariant ? formatParams(this.currentVariant.params) : '';
        const currentTest = this.currentTestCase
            ? `${this.currentTestCase.label || this.currentTestCase.id}${variantDisplay ? ` (${variantDisplay})` : ''}`
            : 'Initializing...';
        const completedTests = this.results.length;
        let totalTests = 0;
        for (const testCase of this.config.testCases) {
            totalTests += testCase.variants.filter((v) => v.available).length;
        }

        this.ui.updateProgress(
            this.isRunning ? 'running' : 'complete',
            currentTest,
            completedTests,
            totalTests,
            this.updateIndex,
            this.totalUpdates,
            this.version,
            this.config.warnings,
            showExportButton
        );
    }

    private formatTestCase(testCase: string): string {
        const tc = this.config.testCases.find((t) => t.id === testCase);
        return tc?.label || testCase;
    }

    private buildExportData() {
        const chartElement = document.getElementById('myChart');
        const chartRect = chartElement?.getBoundingClientRect();

        // Derive parameter keys from results
        const parameterKeys: string[] = [];
        for (const r of this.results) {
            for (const key of Object.keys(r.params)) {
                if (!parameterKeys.includes(key)) {
                    parameterKeys.push(key);
                }
            }
        }

        return {
            version: this.version,
            parameterKeys,
            environment: {
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
                chart: chartRect
                    ? {
                          width: Math.round(chartRect.width),
                          height: Math.round(chartRect.height),
                      }
                    : null,
                devicePixelRatio: window.devicePixelRatio,
            },
            metadata: this.config.metadata || {},
            results: this.results.map((r) => ({
                testCase: this.formatTestCase(r.testCase),
                params: r.params,
                averageTime: r.averageTime,
                minTime: r.minTime,
                maxTime: r.maxTime,
                sampleCount: r.sampleCount,
                timings: r.timings,
            })),
        };
    }

    private displayResults(): void {
        this.updateProgress(true);
        this.ui.displayResults(
            this.results,
            (testCase) => this.formatTestCase(testCase),
            this.version,
            this.config.metadata,
            () => {
                const exportData = this.buildExportData();
                const json = JSON.stringify(exportData, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `benchmark-results-${new Date().toISOString()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
        );
    }
}

/**
 * Initialize benchmark system.
 * This is called by the loader snippet after dynamic import.
 */
export function initBenchmark(config: BenchmarkConfig): void {
    if (config?.testCases?.length === 0) {
        console.warn('initBenchmark: Invalid or empty config provided');
        return;
    }

    const normalizedConfig = normalizeConfig(config);

    const ui = new BenchmarkUI();
    ui.init();

    const runner = new BenchmarkRunner(normalizedConfig, ui);

    // Set up run button handler
    ui.setRunButtonHandler(() => {
        void runner.run();
    });

    // Check for auto-run URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('benchmark') === 'true') {
        setTimeout(() => {
            void runner.run();
        }, 1000);
    }

    // Expose runner on window for debugging
    (window as unknown as { __benchmarkRunner: BenchmarkRunner }).__benchmarkRunner = runner;
}
