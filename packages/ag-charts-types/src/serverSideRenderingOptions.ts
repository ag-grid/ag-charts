import type { ContextDefault, DatumDefault } from './chart/types';
import type { AgChartOptions, AgFinancialChartOptions, AgGaugeOptions } from './chartBuilderOptions';

export type AgImageFormat = 'png' | 'jpeg';

type AgRenderExcludedKeys = 'width' | 'height' | 'container';

/** Base render options shared by all server-side render methods. */
export interface AgBaseRenderOptions {
    /** Output image width in pixels. */
    width: number;
    /** Output image height in pixels. */
    height: number;
    /** Output image format. Default: `'png'`. */
    format?: AgImageFormat;
    /** Pixel density multiplier for high-DPI output. Default: `1`. */
    pixelRatio?: number;
    /** JPEG quality 0–100 (only applies when `format` is `'jpeg'`). */
    quality?: number;
    /** Render timeout in milliseconds. Default: `30000`. */
    timeout?: number;
}

/** Render options for server-side chart rendering, parameterised by chart options type. */
export interface AgChartRenderOptions<T> extends AgBaseRenderOptions {
    /** Chart configuration options (excludes `container`, `width`, and `height`). */
    options: Omit<T, AgRenderExcludedKeys>;
}

/** Render options for standard charts. */
export interface AgRenderOptions extends AgBaseRenderOptions {
    /** Chart configuration options (excludes `container`, `width`, and `height`). */
    options: Omit<AgChartOptions<DatumDefault, ContextDefault>, AgRenderExcludedKeys>;
}

/** Render options for gauge charts. */
export interface AgGaugeRenderOptions extends AgBaseRenderOptions {
    /** Chart configuration options (excludes `container`, `width`, and `height`). */
    options: Omit<AgGaugeOptions<DatumDefault, ContextDefault>, AgRenderExcludedKeys>;
}

/** Render options for financial charts. */
export interface AgFinancialChartRenderOptions extends AgBaseRenderOptions {
    /** Chart configuration options (excludes `container`, `width`, and `height`). */
    options: Omit<AgFinancialChartOptions<DatumDefault>, AgRenderExcludedKeys>;
}

/** Static API for server-side chart rendering. */
export interface AgChartsServerSideApi {
    /** Renders a standard chart to an image buffer. */
    render(options: AgRenderOptions): Promise<Uint8Array>;
    /** Renders a gauge chart to an image buffer. */
    renderGauge(options: AgGaugeRenderOptions): Promise<Uint8Array>;
    /** Renders a financial chart to an image buffer. */
    renderFinancialChart(options: AgFinancialChartRenderOptions): Promise<Uint8Array>;
    /** Registers custom fonts for rendering. */
    loadFonts(fonts: AgFontDefinition[]): void;
}

/** Font definition for server-side rendering custom fonts. */
export interface AgFontDefinition {
    /** Font family name used in chart options. */
    family: string;
    /** File path to the font file (`.ttf`, `.otf`, etc.). Font variants (weight, style) are detected automatically from the font file metadata. */
    path: string;
}
