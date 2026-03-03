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

interface CompactResult {
    testCase: string;
    params: Record<string, string>;
    averageTime: number;
    minTime: number;
    maxTime: number;
    sampleCount: number;
}

interface CompactExportData {
    version: string;
    environment: {
        viewport: { width: number; height: number };
        chart?: { width: number; height: number } | null;
        devicePixelRatio: number;
        hostname?: string;
    };
    metadata?: Record<string, unknown>;
    results: CompactResult[];
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

function resultKey(result: { testCase: string; params: Record<string, string> }): string {
    const sortedParams = Object.entries(result.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`);
    return [result.testCase, ...sortedParams].join('|');
}

function isValidCompactExportData(data: unknown): data is CompactExportData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    if (!Array.isArray(d.results) || d.results.length === 0) return false;
    const first = d.results[0] as Record<string, unknown>;
    return typeof first.testCase === 'string' && first.params != null && typeof first.averageTime === 'number';
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
        --bm-change-faster: #28a745;  /* green - current is faster than baseline */
        --bm-change-slower: #dc3545;  /* red - current is slower than baseline */
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
        --bm-change-faster: #4ade80;  /* lighter green for dark mode */
        --bm-change-slower: #f87171;  /* lighter red for dark mode */
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
        warnings: string[]
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

        this.progressElement.style.cssText =
            'padding: 12px 16px; background-color: transparent; border: none; border-radius: 0; font-family: system-ui, -apple-system, sans-serif;';
        this.progressElement.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between;">
                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                    <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${statusText}
                    </span>
                    ${
                        status === 'running'
                            ? `<span style="background: var(--bm-primary-bg); color: white; padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; white-space: nowrap;">
                        ${currentTest}
                    </span>`
                            : ''
                    }
                    <span style="background: var(--bm-badge-bg); color: var(--bm-badge-text); padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; border: 1px solid var(--bm-badge-border); white-space: nowrap;">
                        Tests: ${completedTests}/${totalTests} <strong style="color: var(--bm-badge-accent);">${testProgress}%</strong>
                    </span>
                    <span style="background: var(--bm-badge-bg); color: var(--bm-badge-text); padding: 5px 12px; border-radius: 12px; font-weight: 500; font-size: 12px; border: 1px solid var(--bm-badge-border); white-space: nowrap;">
                        Runs: ${updateIndex}/${totalUpdates} <strong style="color: var(--bm-badge-accent);">${updateProgress}%</strong>
                    </span>
                    ${warningsBadges}
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                    <span id="benchmark-info-btn-slot" style="position: relative; display: flex; align-items: center;"></span>
                    <span style="background: var(--bm-version-bg); color: var(--bm-version-text); padding: 4px 12px; border-radius: 12px; border: 1px solid var(--bm-version-border); font-size: 12px; font-weight: 500; white-space: nowrap;">
                        v${version}
                    </span>
                    <span id="benchmark-action-btns-slot" style="position: relative; display: flex; gap: 6px; align-items: center;"></span>
                </div>
            </div>
        `;
    }

    displayResults(
        results: BenchmarkResult[],
        formatTestCase: (testCase: string) => string,
        version: string,
        _metadata?: Record<string, unknown>,
        onExport?: () => void,
        baselineData?: CompactExportData | null
    ): void {
        if (!this.resultsElement) return;

        // Numeric columns start at col 3 (Test Case + Parameters + first numeric)
        const firstNumericCol = 3;

        let html = `
            <style>
                .benchmark-table-container {
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
                .benchmark-change {
                    font-size: 11px;
                    margin-top: 2px;
                    cursor: default;
                }
                .benchmark-action-btn {
                    height: 28px;
                    min-width: 28px;
                    border-radius: 6px;
                    border: 1px solid var(--bm-table-border);
                    background: var(--bm-table-header-start);
                    color: var(--bm-table-header-text);
                    font-size: 16px;
                    line-height: 1;
                    cursor: pointer;
                    padding: 0 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .benchmark-action-btn:hover {
                    background: var(--bm-table-header-end);
                    border-color: var(--bm-table-header-text);
                }
                .benchmark-action-btn.bm-flash-success {
                    background: var(--bm-change-faster);
                    border-color: var(--bm-change-faster);
                    color: white;
                }
                .benchmark-action-btn.bm-flash-error {
                    background: var(--bm-change-slower);
                    border-color: var(--bm-change-slower);
                    color: white;
                }
                .benchmark-info-popup {
                    position: absolute;
                    top: calc(100% + 4px);
                    right: 0;
                    background: var(--bm-container-bg);
                    border: 1px solid var(--bm-table-border);
                    border-radius: 4px;
                    padding: 8px 12px;
                    font-size: 12px;
                    color: var(--bm-table-text);
                    font-family: system-ui, -apple-system, sans-serif;
                    white-space: nowrap;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
            </style>
        `;

        let baselineMap: Map<string, CompactResult> | null = null;
        let infoSlotHtml: string;
        if (baselineData) {
            baselineMap = new Map<string, CompactResult>();
            for (const r of baselineData.results) {
                baselineMap.set(resultKey(r), r);
            }

            const vp = baselineData.environment.viewport;
            const dpr = baselineData.environment.devicePixelRatio;
            const currentHostname = window.location.hostname || undefined;
            const baselineHostname = baselineData.environment.hostname;
            const showHostnames = currentHostname || baselineHostname;
            const currentLabel = showHostnames && currentHostname ? ` (${currentHostname})` : '';
            const baselineLabel = showHostnames && baselineHostname ? ` (${baselineHostname})` : '';
            infoSlotHtml = `<button class="benchmark-action-btn" title="Comparison details" onclick="var p=this.nextElementSibling;p.style.display=p.style.display==='none'?'block':'none'">ⓘ</button>
                <div class="benchmark-info-popup" style="display: none;">
                    Comparing <strong>v${version}${currentLabel}</strong> vs <strong>v${baselineData.version}${baselineLabel}</strong><br>${vp.width}×${vp.height}px, ${dpr}× DPR
                </div>`;
        } else {
            // Always reserve space for the info button so the other buttons don't shift when it appears
            infoSlotHtml = `<button class="benchmark-action-btn" style="visibility: hidden;" tabindex="-1" aria-hidden="true">ⓘ</button>`;
        }

        html += '<div class="benchmark-table-wrapper">';
        html += '<div class="benchmark-table-container">';
        html += '<table class="benchmark-table"><thead><tr>';
        html += '<th>Test Case</th>';
        html += '<th>Parameters</th>';
        html += '<th>Avg (ms)</th>';
        html += '<th>Min (ms)</th>';
        html += '<th>Max (ms)</th>';
        html += '<th>Samples</th>';
        html += '</tr></thead><tbody>';

        results.forEach((result) => {
            let avgCell = result.averageTime.toFixed(3);
            if (baselineMap) {
                const baseline = baselineMap.get(
                    resultKey({ testCase: formatTestCase(result.testCase), params: result.params })
                );
                if (baseline) {
                    const changePct = ((result.averageTime - baseline.averageTime) / baseline.averageTime) * 100;
                    let changeText: string;
                    let changeStyle = '';
                    if (Math.abs(changePct) <= 1) {
                        changeText = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`;
                    } else if (changePct < 0) {
                        changeText = `${changePct.toFixed(1)}%`;
                        changeStyle = 'color: var(--bm-change-faster); font-weight: 600;';
                    } else {
                        changeText = `+${changePct.toFixed(1)}%`;
                        changeStyle = 'color: var(--bm-change-slower); font-weight: 600;';
                    }
                    avgCell = `${result.averageTime.toFixed(3)}<div class="benchmark-change" style="${changeStyle}" title="Baseline: ${baseline.averageTime.toFixed(3)}ms">${changeText}</div>`;
                }
            }

            html += '<tr>';
            html += `<td>${formatTestCase(result.testCase)}</td>`;
            html += `<td><span class="benchmark-param">${formatParams(result.params)}</span></td>`;
            html += `<td>${avgCell}</td>`;
            html += `<td>${result.minTime.toFixed(3)}</td>`;
            html += `<td>${result.maxTime.toFixed(3)}</td>`;
            html += `<td>${result.sampleCount}</td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        html += '</div>'; // close benchmark-table-container
        html += '</div>'; // close benchmark-table-wrapper

        this.resultsElement.innerHTML = html;

        // Inject main action buttons into the slot to the right of the version badge
        const slot = document.getElementById('benchmark-action-btns-slot');
        if (slot) {
            slot.innerHTML = `
                <button class="benchmark-action-btn" id="copyBenchmarkResults" title="Copy results to clipboard">⎘</button>
                <button class="benchmark-action-btn" id="exportBenchmarkResults" title="Export as JSON">⤓</button>
                <button class="benchmark-action-btn" id="compareBenchmarkResults" title="Compare with clipboard">⇄</button>`;
        }

        // Inject info button into its dedicated slot to the left of the version badge
        const infoSlot = document.getElementById('benchmark-info-btn-slot');
        if (infoSlot) {
            infoSlot.innerHTML = infoSlotHtml;
        }

        // Wire up export button
        const exportButton = document.getElementById('exportBenchmarkResults');
        if (exportButton && onExport) {
            exportButton.addEventListener('click', onExport);
        } else if (exportButton) {
            exportButton.remove();
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

    clearResults(): void {
        if (this.resultsElement) {
            this.resultsElement.innerHTML = '';
        }
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

    showEventBlockingIndicator(): void {
        const chartElement = document.getElementById('myChart') as HTMLElement | null;
        if (chartElement) {
            chartElement.style.cursor = 'not-allowed';
        }
        const chartParent = this.getChartParentWithPositioning();
        if (!chartParent || document.getElementById('benchmarkEventBlockBadge')) return;
        const badge = document.createElement('div');
        badge.id = 'benchmarkEventBlockBadge';
        badge.textContent = 'Events Blocked';
        badge.style.cssText =
            'position: absolute; top: 10px; left: 10px; z-index: 101; background: rgba(0,0,0,0.7); color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; pointer-events: none;';
        chartParent.appendChild(badge);
    }

    hideEventBlockingIndicator(): void {
        const chartElement = document.getElementById('myChart') as HTMLElement | null;
        if (chartElement) {
            chartElement.style.cursor = '';
        }
        document.getElementById('benchmarkEventBlockBadge')?.remove();
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
    private eventBlockers: Array<{ el: Element; type: string; handler: (e: Event) => void }> = [];
    private baselineData: CompactExportData | null = null;
    private clipboardPollInterval: ReturnType<typeof setInterval> | null = null;

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

        if (this.clipboardPollInterval !== null) {
            clearInterval(this.clipboardPollInterval);
            this.clipboardPollInterval = null;
        }
        this.isRunning = true;
        this.results = [];
        this.updateIndex = 0;
        this.totalUpdates = this.calculateTotalUpdates();

        this.ui.clearResults();
        this.ui.hideControls();
        this.ui.show();
        this.installEventBlockers();
        this.ui.showEventBlockingIndicator();
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

                // Reset any tooltips/highlights left by hover-based test cases.
                // Must target the inner element the chart listens on (same as hover()).
                const chartEl = document.getElementById('myChart');
                if (chartEl) {
                    const leaveTarget =
                        (chartEl.querySelector('.ag-charts-series-area') as HTMLElement) ??
                        (chartEl.querySelector('canvas') as HTMLElement) ??
                        chartEl;
                    leaveTarget.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                }
            }

            this.isRunning = false;
            this.currentTestCase = null;
            this.currentVariant = null;
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
            this.removeEventBlockers();
            this.ui.hideEventBlockingIndicator();
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

    private updateProgress(): void {
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
            this.config.warnings
        );
    }

    private installEventBlockers(): void {
        const chartElement = document.getElementById('myChart');
        if (!chartElement) return;

        const eventTypes = [
            'mousemove',
            'mousedown',
            'mouseup',
            'mouseenter',
            'mouseleave',
            'click',
            'dblclick',
            'pointerdown',
            'pointermove',
            'pointerup',
            'pointerover',
            'pointerout',
            'wheel',
            'contextmenu',
        ];

        for (const type of eventTypes) {
            const handler = (e: Event) => {
                if (e.isTrusted) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
            };
            chartElement.addEventListener(type, handler, { capture: true });
            this.eventBlockers.push({ el: chartElement, type, handler });
        }
    }

    private removeEventBlockers(): void {
        for (const { el, type, handler } of this.eventBlockers) {
            el.removeEventListener(type, handler, { capture: true });
        }
        this.eventBlockers = [];
    }

    private formatTestCase(testCase: string): string {
        const tc = this.config.testCases.find((t) => t.id === testCase);
        return tc?.label || testCase;
    }

    private buildCompactExportData(): CompactExportData {
        const chartElement = document.getElementById('myChart');
        const chartRect = chartElement?.getBoundingClientRect();

        return {
            version: this.version,
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
                hostname: window.location.hostname || undefined,
            },
            metadata: this.config.metadata || {},
            results: this.results.map((r) => ({
                testCase: this.formatTestCase(r.testCase),
                params: r.params,
                averageTime: r.averageTime,
                minTime: r.minTime,
                maxTime: r.maxTime,
                sampleCount: r.sampleCount,
            })),
        };
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
                hostname: window.location.hostname || undefined,
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
        if (this.clipboardPollInterval !== null) {
            clearInterval(this.clipboardPollInterval);
            this.clipboardPollInterval = null;
        }
        this.updateProgress();
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
            },
            this.baselineData
        );

        // Wire up Copy button
        const copyBtn = document.getElementById('copyBenchmarkResults') as HTMLButtonElement | null;
        if (copyBtn) {
            copyBtn.addEventListener(
                'click',
                () => {
                    const json = JSON.stringify(this.buildCompactExportData(), null, 2);
                    navigator.clipboard.writeText(json).then(
                        () => {
                            copyBtn.classList.add('bm-flash-success');
                            setTimeout(() => copyBtn.classList.remove('bm-flash-success'), 600);
                        },
                        () => {
                            copyBtn.classList.add('bm-flash-error');
                            setTimeout(() => copyBtn.classList.remove('bm-flash-error'), 600);
                        }
                    );
                },
                { once: true }
            );
        }

        // Wire up Compare button — toggles comparison on/off
        const compareBtn = document.getElementById('compareBenchmarkResults') as HTMLButtonElement | null;
        if (compareBtn) {
            // If already in compare mode, show button as active
            if (this.baselineData) {
                compareBtn.style.background = 'var(--bm-status-complete)';
                compareBtn.style.color = 'white';
                compareBtn.title = 'Comparing — click to exit comparison';
            }

            compareBtn.addEventListener('click', () => {
                if (this.baselineData) {
                    // Exit comparison mode
                    this.baselineData = null;
                    this.displayResults();
                } else {
                    void navigator.clipboard.readText().then(
                        (text) => {
                            let parsed: unknown;
                            try {
                                parsed = JSON.parse(text);
                            } catch {
                                this.ui.showError('Invalid benchmark data in clipboard.');
                                return;
                            }
                            if (!isValidCompactExportData(parsed)) {
                                this.ui.showError('Invalid benchmark data in clipboard.');
                                return;
                            }
                            this.baselineData = parsed;
                            this.displayResults();
                        },
                        () => {
                            this.ui.showError('Clipboard read failed. Copy benchmark results first.');
                        }
                    );
                }
            });
        }

        // Poll clipboard every 1s to keep the Compare button highlight in sync
        const pollClipboard = () => {
            const btn = document.getElementById('compareBenchmarkResults') as HTMLButtonElement | null;
            if (!btn) {
                // Button gone (e.g. results cleared) — stop polling
                if (this.clipboardPollInterval !== null) {
                    clearInterval(this.clipboardPollInterval);
                    this.clipboardPollInterval = null;
                }
                return;
            }
            // Don't overwrite the "active comparison" styling
            if (this.baselineData) return;
            void navigator.clipboard.readText().then(
                (text) => {
                    try {
                        const hasData = isValidCompactExportData(JSON.parse(text));
                        btn.style.background = hasData ? 'var(--bm-status-complete)' : '';
                        btn.style.color = hasData ? 'white' : '';
                        btn.title = hasData
                            ? 'Clipboard contains benchmark data — click to compare'
                            : 'Compare with clipboard';
                    } catch {
                        btn.style.background = '';
                        btn.style.color = '';
                    }
                },
                () => {
                    /* clipboard access denied — ignore silently */
                }
            );
        };
        pollClipboard();
        this.clipboardPollInterval = setInterval(pollClipboard, 1000);
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
