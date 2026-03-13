import { FontLibrary } from 'skia-canvas';

import { AgCharts } from 'ag-charts-community';
import { enterpriseRegistry, withTimeout } from 'ag-charts-core';
// Side-effect: registers enterprise modules on enterpriseRegistry
import 'ag-charts-enterprise';

import { NodeCanvas, type NodeCanvasInstance } from './canvasConfig';
import { patchDocumentCreateElement } from './documentPatch';
import { createIsolatedEnvironment } from './environment';
import type { AgFinancialChartRenderOptions, AgFontDefinition, AgGaugeRenderOptions, AgRenderOptions } from './types';

const DEFAULT_TIMEOUT = 30000;

// Module-level mutex to serialize renders (prevents global document/window races)
let renderLock: Promise<void> = Promise.resolve();

export class AgChartsServerSide {
    /**
     * Acquire exclusive access for rendering.
     * Returns a release function to call when done.
     */
    private static async acquireLock(): Promise<() => void> {
        let release!: () => void;
        const acquired = new Promise<void>((resolve) => {
            release = resolve;
        });
        const previousLock = renderLock;
        renderLock = acquired;
        await previousLock;
        return release;
    }

    /**
     * Render a standard chart to an image buffer.
     */
    static async render(renderOptions: AgRenderOptions): Promise<Buffer> {
        return this.renderInternal(renderOptions, 'create');
    }

    /**
     * Render a gauge to an image buffer.
     */
    static async renderGauge(renderOptions: AgGaugeRenderOptions): Promise<Buffer> {
        return this.renderInternal(renderOptions, 'createGauge');
    }

    /**
     * Render a financial chart to an image buffer.
     */
    static async renderFinancialChart(renderOptions: AgFinancialChartRenderOptions): Promise<Buffer> {
        return this.renderInternal(renderOptions, 'createFinancialChart');
    }

    /**
     * Load custom fonts for rendering.
     */
    static loadFonts(fonts: AgFontDefinition[]): void {
        for (const font of fonts) {
            FontLibrary.use(font.family, font.path);
        }
    }

    private static async renderInternal(
        renderOptions: AgRenderOptions | AgGaugeRenderOptions | AgFinancialChartRenderOptions,
        api: 'create' | 'createGauge' | 'createFinancialChart'
    ): Promise<Buffer> {
        const {
            options,
            width,
            height,
            format = 'png',
            pixelRatio = 1,
            quality,
            timeout = DEFAULT_TIMEOUT,
        } = renderOptions;

        if (width <= 0 || height <= 0) {
            throw new Error(`Invalid dimensions: width=${width}, height=${height}`);
        }

        // Serialize renders to prevent global document/window races
        const release = await this.acquireLock();

        const env = createIsolatedEnvironment();

        // Local canvas stack for this render
        const mainCanvas = new NodeCanvas(width * pixelRatio, height * pixelRatio);
        const canvasStack: NodeCanvasInstance[] = [mainCanvas];

        let chart: { destroy(): void } | undefined;

        try {
            patchDocumentCreateElement(env.document, {
                getCanvas: () => canvasStack.shift() ?? new NodeCanvas(width * pixelRatio, height * pixelRatio),
            });

            const container = env.document.getElementById('container')!;

            // Show watermark for unlicensed enterprise use.
            // We use getWatermarkForegroundConfig() (not getWatermarkForegroundConfigForBrowser())
            // because SSR should always show the watermark when unlicensed, even for localhost.
            // Console output is guarded by LicenseManager.licenseOutputLogged to print at most once.
            let chartOptions: any = options;
            const licenseManager = enterpriseRegistry.licenseManager?.({ document: env.document } as any);
            if (licenseManager) {
                licenseManager.validateLicense();
                const foreground = licenseManager.getWatermarkForegroundConfig();
                if (foreground) {
                    chartOptions = { ...options, foreground };
                }
            }

            const createdChart = AgCharts[api]({
                ...chartOptions,
                container,
                document: env.document,
                window: env.window,
                skipCss: true,
                width,
                height,
                overrideDevicePixelRatio: pixelRatio,
            });
            chart = createdChart;

            await withTimeout(createdChart.waitForUpdate(), timeout, `Render timeout after ${timeout}ms`);

            const exportOptions = format === 'jpeg' && quality !== undefined ? { quality: quality / 100 } : undefined;
            const buffer = mainCanvas.toBufferSync(format, exportOptions);

            return buffer;
        } finally {
            chart?.destroy();
            env.dispose();
            release();
        }
    }
}
