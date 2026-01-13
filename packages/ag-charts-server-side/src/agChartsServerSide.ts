import type { ExportFormat } from 'skia-canvas';
import { FontLibrary, Image } from 'skia-canvas';

import { AgCharts } from 'ag-charts-community';

import { NodeCanvas } from './canvas-config';
import { createIsolatedEnvironment } from './environment';
import type { FinancialChartRenderOptions, FontDefinition, GaugeRenderOptions, RenderOptions } from './types';

const DEFAULT_TIMEOUT = 30000;

/** Document with overridable createElement for mock canvas injection */
interface MockableDocument extends Document {
    createElement: (tagName: string, options?: ElementCreationOptions) => HTMLElement;
}

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
     * Load custom fonts for rendering.
     */
    static loadFonts(fonts: FontDefinition[]): void {
        for (const font of fonts) {
            FontLibrary.use(font.family, font.path);
        }
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
            const doc = env.document as MockableDocument;
            const realCreateElement = doc.createElement.bind(doc);
            doc.createElement = (tag: string, opts?: ElementCreationOptions): HTMLElement => {
                if (tag === 'canvas') {
                    const canvas = canvasStack.shift() ?? new NodeCanvas(width * pixelRatio, height * pixelRatio);
                    const mockElement = realCreateElement(tag, opts) as HTMLCanvasElement;

                    const originalGetContext = mockElement.getContext.bind(mockElement);
                    Object.defineProperty(mockElement, 'getContext', {
                        value: (contextId: string, _options?: unknown) => {
                            if (contextId === '2d') {
                                return canvas.getContext('2d');
                            }
                            return originalGetContext(contextId as '2d');
                        },
                        writable: true,
                        configurable: true,
                    });

                    Object.defineProperty(mockElement, 'toDataURL', {
                        value: (mimeType = 'image/png') => {
                            return canvas.toDataURLSync(mimeType.split('/')[1] as ExportFormat);
                        },
                        writable: true,
                        configurable: true,
                    });

                    return mockElement;
                }
                if (tag === 'img') {
                    return new Image() as unknown as HTMLImageElement;
                }
                return realCreateElement(tag, opts);
            };

            const container = env.document.getElementById('container')!;

            // Note: as any is required because AgCharts API methods have incompatible union types
            // that TypeScript cannot narrow properly when api is a union of method names
            const chart = AgCharts[api]({
                ...options,
                container,
                document: env.document,
                window: env.window,
                skipCss: true,
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
