import { hasConstrainedCanvasMemory } from '../../util/userAgent';

export type Size = { width: number; height: number };

// Work-around for typing issues with Angular 13+ (see AG-6969),
type OffscreenCanvasRenderingContext2D = any;

/**
 * Wraps the native Canvas element and overrides its CanvasRenderingContext2D to
 * provide resolution independent rendering based on `window.devicePixelRatio`.
 */
export class HdpiCanvas {
    static document: Document = globalThis.document;
    readonly document: Document;
    readonly window: Window;
    readonly element: HTMLCanvasElement;
    readonly realContext: CanvasRenderingContext2D;
    readonly context: CanvasRenderingContext2D & { verifyDepthZero?: () => void };
    readonly imageSource: HTMLCanvasElement;

    // The width/height attributes of the Canvas element default to
    // 300/150 according to w3.org.
    constructor(opts: {
        document: Document;
        window: Window;
        width?: number;
        height?: number;
        domLayer?: boolean;
        zIndex?: number;
        name?: string;
        overrideDevicePixelRatio?: number;
    }) {
        const {
            document,
            window,
            width = 600,
            height = 300,
            domLayer = false,
            zIndex = 0,
            name = undefined as undefined | string,
            overrideDevicePixelRatio = undefined as undefined | number,
        } = opts;
        this.document = document;
        this.window = window;
        HdpiCanvas.document = document;

        // Create canvas and immediately apply width + height to avoid out-of-memory
        // errors on iOS/iPadOS Safari.
        this.element = document.createElement('canvas');
        this.element.width = width;
        this.element.height = height;

        this.realContext = this.element.getContext('2d')!;
        this.imageSource = this.realContext.canvas;

        const { style } = this.element;

        style.userSelect = 'none';
        style.display = 'block';

        if (domLayer) {
            style.position = 'absolute';
            style.zIndex = String(zIndex);
            style.top = '0';
            style.left = '0';
            style.pointerEvents = 'none';
            style.opacity = `1`;
            if (name) {
                this.element.id = name;
            }
        }

        this.context = this.setPixelRatio(overrideDevicePixelRatio);
        this.resize(width, height);
    }

    private _container?: HTMLElement;
    set container(value: HTMLElement | undefined) {
        if (this._container !== value) {
            this.remove();

            if (value) {
                value.appendChild(this.element);
            }

            this._container = value;
        }
    }
    get container(): HTMLElement | undefined {
        return this._container;
    }

    private _enabled: boolean = true;
    set enabled(value: boolean) {
        this.element.style.display = value ? 'block' : 'none';
        this._enabled = !!value;
    }
    get enabled() {
        return this._enabled;
    }

    private remove() {
        const { parentNode } = this.element;

        if (parentNode != null) {
            parentNode.removeChild(this.element);
        }
    }

    destroy() {
        this.element.remove();

        // Workaround memory allocation quirks in iOS Safari by resizing to 0x0 and clearing.
        // See https://bugs.webkit.org/show_bug.cgi?id=195325.
        this.element.width = 0;
        this.element.height = 0;
        this.context.clearRect(0, 0, 0, 0);

        Object.freeze(this);
    }

    snapshot() {
        // No-op for compatibility with HdpiOffscreenCanvas.
    }

    clear() {
        this.context.save();
        this.context.resetTransform();
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.restore();
    }

    toImage(): HTMLImageElement {
        const img = this.document.createElement('img');
        img.src = this.getDataURL();
        return img;
    }

    getDataURL(type?: string): string {
        return this.element.toDataURL(type);
    }

    /**
     * @param fileName The name of the downloaded file.
     * @param fileFormat The file format, the default is `image/png`
     */
    download(fileName?: string, fileFormat = 'image/png') {
        fileName = (fileName ?? '').trim() || 'image';

        const dataUrl = this.getDataURL(fileFormat);
        const document = this.document;

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a); // required for the `click` to work in Firefox
        a.click();
        document.body.removeChild(a);
    }

    // `NaN` is deliberate here, so that overrides are always applied
    // and the `resetTransform` inside the `resize` method works in IE11.
    _pixelRatio: number = NaN;
    get pixelRatio(): number {
        return this._pixelRatio;
    }

    /**
     * Changes the pixel ratio of the Canvas element to the given value,
     * or uses the window.devicePixelRatio (default), then resizes the Canvas
     * element accordingly (default).
     */
    private setPixelRatio(ratio?: number) {
        let pixelRatio = ratio ?? this.window.devicePixelRatio;
        if (hasConstrainedCanvasMemory()) {
            // Mobile browsers have stricter memory limits, we reduce rendering resolution to
            // improve stability on mobile browsers. iOS Safari 12->16 are pain-points since they
            // have memory allocation quirks - see https://bugs.webkit.org/show_bug.cgi?id=195325.
            pixelRatio = 1;
        }
        this._pixelRatio = pixelRatio;

        return HdpiCanvas.overrideScale(this.realContext, pixelRatio);
    }

    set pixelated(value: boolean) {
        this.element.style.imageRendering = value ? 'pixelated' : 'auto';
    }
    get pixelated(): boolean {
        return this.element.style.imageRendering === 'pixelated';
    }

    private _width: number = 0;
    get width(): number {
        return this._width;
    }

    private _height: number = 0;
    get height(): number {
        return this._height;
    }

    resize(width: number, height: number) {
        if (!(width > 0 && height > 0)) {
            return;
        }
        const { element, context, pixelRatio } = this;
        element.width = Math.round(width * pixelRatio);
        element.height = Math.round(height * pixelRatio);
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        context.resetTransform();

        this._width = width;
        this._height = height;
    }

    // 2D canvas context used for measuring text.
    private static _textMeasuringContext?: CanvasRenderingContext2D;
    private static get textMeasuringContext(): CanvasRenderingContext2D {
        if (this._textMeasuringContext) {
            return this._textMeasuringContext;
        }
        const canvas = this.document.createElement('canvas');
        this._textMeasuringContext = canvas.getContext('2d')!;
        return this._textMeasuringContext;
    }

    // Offscreen SVGTextElement for measuring text. This fallback method
    // is at least 25 times slower than `CanvasRenderingContext2D.measureText`.
    // Using a <span> and its `getBoundingClientRect` for text measurement
    // is also slow and often results in a grossly incorrect measured height.
    private static _svgText?: SVGTextElement;
    private static get svgText(): SVGTextElement {
        if (this._svgText) {
            return this._svgText;
        }

        const xmlns = 'http://www.w3.org/2000/svg';

        const svg = document.createElementNS(xmlns, 'svg');
        svg.setAttribute('width', '100');
        svg.setAttribute('height', '100');
        // Add a descriptive class name in case someone sees this SVG element
        // in devtools and wonders about its purpose:
        if (svg.classList) {
            svg.classList.add('text-measuring-svg');
        } else {
            svg.setAttribute('class', 'text-measuring-svg');
        }
        svg.style.position = 'absolute';
        svg.style.top = '-1000px';
        svg.style.visibility = 'hidden';

        const svgText = document.createElementNS(xmlns, 'text');
        svgText.setAttribute('x', '0');
        svgText.setAttribute('y', '30');
        svgText.setAttribute('text', 'black');

        svg.appendChild(svgText);
        document.body.appendChild(svg);

        this._svgText = svgText;

        return svgText;
    }

    private static _has?: {
        textMetrics: boolean;
        getTransform: boolean;
    };
    static get has() {
        if (this._has) {
            return this._has;
        }
        const isChrome = typeof navigator === 'undefined' || navigator.userAgent.indexOf('Chrome') > -1;
        const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Firefox') > -1;
        const isSafari = !isChrome && typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Safari') > -1;
        this._has = Object.freeze({
            textMetrics:
                this.textMeasuringContext.measureText('test').actualBoundingBoxDescent !== undefined &&
                // Firefox implemented advanced TextMetrics object in v74:
                // https://bugzilla.mozilla.org/show_bug.cgi?id=1102584
                // but it's buggy, so we'll keep using the SVG for text measurement in Firefox for now.
                !isFirefox &&
                !isSafari,
            getTransform: this.textMeasuringContext.getTransform !== undefined,
        });
        return this._has;
    }

    static measureText(
        text: string,
        font: string,
        textBaseline: CanvasTextBaseline,
        textAlign: CanvasTextAlign
    ): TextMetrics {
        const ctx = this.textMeasuringContext;
        ctx.font = font;
        ctx.textBaseline = textBaseline;
        ctx.textAlign = textAlign;
        return ctx.measureText(text);
    }

    /**
     * Returns the width and height of the measured text.
     * @param text The single-line text to measure.
     * @param font The font shorthand string.
     */
    static getTextSize(text: string, font: string): Size {
        if (this.has.textMetrics) {
            const ctx = this.textMeasuringContext;
            ctx.font = font;
            const metrics = ctx.measureText(text);

            return {
                width: metrics.width,
                height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
            };
        } else {
            return this.measureSvgText(text, font);
        }
    }

    private static textSizeCache: { [font: string]: { [text: string]: Size } } = {};

    private static measureSvgText(text: string, font: string): Size {
        const cache = this.textSizeCache;
        const fontCache = cache[font];

        // Note: consider not caching the size of numeric strings.
        // For example: if (isNaN(+text)) { // skip

        if (fontCache) {
            const size = fontCache[text];
            if (size) {
                return size;
            }
        } else {
            cache[font] = {};
        }

        const svgText = this.svgText;

        svgText.style.font = font;
        svgText.textContent = text;

        // `getBBox` returns an instance of `SVGRect` with the same `width` and `height`
        // measurements as `DOMRect` instance returned by the `getBoundingClientRect`.
        // But the `SVGRect` instance has half the properties of the `DOMRect`,
        // so we use the `getBBox` method.
        const bbox = svgText.getBBox();
        const size: Size = {
            width: bbox.width,
            height: bbox.height,
        };

        cache[font][text] = size;

        return size;
    }

    static overrideScale(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, scale: number) {
        let depth = 0;
        const overrides = {
            save() {
                this.$save();
                depth++;
            },
            restore() {
                if (depth > 0) {
                    this.$restore();
                    depth--;
                } else {
                    throw new Error('AG Charts - Unable to restore() past depth 0');
                }
            },
            setTransform(a: number, b: number, c: number, d: number, e: number, f: number) {
                if (typeof a === 'object') {
                    this.$setTransform(a);
                } else {
                    this.$setTransform(a * scale, b * scale, c * scale, d * scale, e * scale, f * scale);
                }
            },
            resetTransform() {
                // As of Jan 8, 2019, `resetTransform` is still an "experimental technology",
                // and doesn't work in IE11 and Edge 44.
                this.$setTransform(scale, 0, 0, scale, 0, 0);
            },
            verifyDepthZero() {
                if (depth !== 0) {
                    throw new Error('AG Charts - Save/restore depth is non-zero: ' + depth);
                }
            },
        } as any;

        for (const name in overrides) {
            if (Object.hasOwn(overrides, name)) {
                // Save native methods under prefixed names,
                // if this hasn't been done by the previous overrides already.
                if (!ctx['$' + name]) {
                    ctx['$' + name] = ctx[name];
                }
                // Replace native methods with overrides,
                // or previous overrides with the new ones.
                ctx[name] = overrides[name];
            }
        }

        return ctx;
    }
}
