import { ExportFormat, FontLibrary, Image } from 'skia-canvas';

import { AgCharts } from 'ag-charts-community';

import { NodeCanvas, registerFallbackFonts } from './canvas-config';
import { createIsolatedEnvironment } from './environment';
import type { FinancialChartRenderOptions, FontDefinition, GaugeRenderOptions, RenderOptions } from './types';

const DEFAULT_TIMEOUT = 30000;

export class AgChartsServerSide {
    /**
     * Render a standard chart to an image buffer.
     */
    static async render(renderOptions: RenderOptions): Promise<Buffer> {
        return this.renderInternal(renderOptions, 'create');
    }

    /**
     * Render a gauge to an image buffer.
     */
    static async renderGauge(renderOptions: GaugeRenderOptions): Promise<Buffer> {
        return this.renderInternal(renderOptions, 'createGauge');
    }

    /**
     * Render a financial chart to an image buffer.
     */
    static async renderFinancialChart(renderOptions: FinancialChartRenderOptions): Promise<Buffer> {
        return this.renderInternal(renderOptions, 'createFinancialChart');
    }

    /**
     * Render chart directly to a file.
     */
    static async renderToFile(renderOptions: RenderOptions, filePath: string): Promise<void> {
        const fs = await import('fs/promises');
        const buffer = await this.render(renderOptions);
        await fs.writeFile(filePath, buffer);
    }

    /**
     * Render gauge directly to a file.
     */
    static async renderGaugeToFile(renderOptions: GaugeRenderOptions, filePath: string): Promise<void> {
        const fs = await import('fs/promises');
        const buffer = await this.renderGauge(renderOptions);
        await fs.writeFile(filePath, buffer);
    }

    /**
     * Render financial chart directly to a file.
     */
    static async renderFinancialChartToFile(
        renderOptions: FinancialChartRenderOptions,
        filePath: string
    ): Promise<void> {
        const fs = await import('fs/promises');
        const buffer = await this.renderFinancialChart(renderOptions);
        await fs.writeFile(filePath, buffer);
    }

    /**
     * Load custom fonts for rendering.
     */
    static loadFonts(fonts: FontDefinition[]): void {
        for (const font of fonts) {
            FontLibrary.use(font.family, font.path);
        }
    }

    /**
     * Register bundled fallback fonts.
     */
    static registerFallbackFonts(fontsDir: string): void {
        registerFallbackFonts(fontsDir);
    }

    private static async renderInternal(
        renderOptions: RenderOptions | GaugeRenderOptions | FinancialChartRenderOptions,
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

        const env = createIsolatedEnvironment();

        // Local canvas stack for this render (thread-safe for concurrent renders)
        const mainCanvas = new NodeCanvas(width * pixelRatio, height * pixelRatio);
        const canvasStack: NodeCanvas[] = [mainCanvas];

        try {
            const realCreateElement = env.document.createElement.bind(env.document);
            (env.document as any).createElement = (tag: string, opts?: any) => {
                if (tag === 'canvas') {
                    const canvas = canvasStack.shift() ?? new NodeCanvas(width * pixelRatio, height * pixelRatio);
                    const mockElement = realCreateElement(tag, opts);

                    const originalGetContext = mockElement.getContext.bind(mockElement);
                    (mockElement as any).getContext = (type: string, _attrs?: any) => {
                        if (type === '2d') {
                            return canvas.getContext('2d');
                        }
                        return originalGetContext(type);
                    };

                    (mockElement as any).toDataURL = (mimeType = 'image/png') => {
                        return canvas.toDataURLSync(mimeType.split('/')[1] as ExportFormat);
                    };

                    return mockElement;
                }
                if (tag === 'img') {
                    return new Image();
                }
                return realCreateElement(tag, opts);
            };

            const container = env.document.getElementById('container')!;

            const chart = AgCharts[api]({
                ...options,
                container,
                document: env.document,
                window: env.window,
                width,
                height,
                overrideDevicePixelRatio: pixelRatio,
            } as any);

            await this.waitWithTimeout(chart.waitForUpdate(), timeout);

            const exportOptions = format === 'jpeg' && quality !== undefined ? { quality: quality / 100 } : undefined;
            const buffer = mainCanvas.toBufferSync(format, exportOptions);

            chart.destroy();

            return buffer;
        } finally {
            env.dispose();
        }
    }

    private static async waitWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        let timer: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(`Render timeout after ${timeoutMs}ms`)), timeoutMs);
        });
        try {
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            clearTimeout(timer!);
        }
    }
}
