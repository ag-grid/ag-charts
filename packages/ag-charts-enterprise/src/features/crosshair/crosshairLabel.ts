import type { AgCrosshairLabelRendererParams, AgCrosshairLabelRendererResult } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { createId, setAttribute } from 'ag-charts-core';

const { FormatManager, BaseProperties, Property } = _ModuleSupport;

const DEFAULT_LABEL_CLASS = 'ag-charts-crosshair-label';
type StyleValue = string | number | undefined;

interface FormatterCache {
    type: string;
    format: string;
    formatter: ((value: any, fractionDigits?: number) => string) | undefined;
}

export class CrosshairLabelProperties extends BaseProperties implements _ModuleSupport.AxisFormattableLabel<any> {
    @Property
    enabled: boolean = true;

    @Property
    xOffset: number = 0;

    @Property
    yOffset: number = 0;

    @Property
    format?: string = undefined;

    @Property
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult = undefined;

    private _cachedFormatter: FormatterCache | undefined = undefined;
    formatValue(_ctx: any, type: 'number' | 'date' | 'category', value: any) {
        const { format } = this;

        let result: string | undefined;
        if (format != null) {
            let cachedFormatter = this._cachedFormatter;
            if (cachedFormatter == null || cachedFormatter.type !== type || cachedFormatter.format !== format) {
                cachedFormatter = {
                    type,
                    format,
                    formatter: FormatManager.getFormatter(type, format),
                };
                this._cachedFormatter = cachedFormatter;
            }

            result ??= cachedFormatter.formatter?.(value);
        }

        return result != null ? String(result) : undefined;
    }
}

export class CrosshairLabel extends CrosshairLabelProperties {
    private readonly id = createId(this);
    private readonly element: HTMLElement;

    constructor(
        private readonly domManager: _ModuleSupport.DOMManager,
        key: string,
        axisId: string
    ) {
        super();

        this.element = domManager.addChild('canvas-overlay', `crosshair-label-${this.id}`);
        this.element.classList.add(DEFAULT_LABEL_CLASS);
        setAttribute(this.element, 'aria-hidden', true);
        this.element.setAttribute('data-key', key);
        this.element.setAttribute('data-axis-id', axisId);
    }

    show(meta: _ModuleSupport.Point) {
        const { element } = this;

        const left = meta.x + this.xOffset;
        const top = meta.y + this.yOffset;

        element.style.top = `${Math.round(top)}px`;
        element.style.left = `${Math.round(left)}px`;

        this.toggle(true);
    }

    setLabelHtml({ html, styles }: { html?: string; styles?: Record<string, StyleValue> }) {
        if (html !== undefined) {
            this.element.innerHTML = html;
        }
        if (styles !== undefined) {
            Object.assign(this.element.style, styles);
        }
    }

    getBBox(): _ModuleSupport.BBox {
        const { element } = this;
        return new _ModuleSupport.BBox(
            element.clientLeft,
            element.clientTop,
            element.clientWidth,
            element.clientHeight
        );
    }

    toggle(visible?: boolean) {
        this.element.classList.toggle(`ag-charts-crosshair-label--hidden`, !visible);
    }

    destroy() {
        this.domManager.removeChild('canvas-overlay', `crosshair-label-${this.id}`);
    }

    toLabelHtml(
        input: string | AgCrosshairLabelRendererResult,
        defaults?: AgCrosshairLabelRendererResult
    ): { html: string; styles: Record<string, StyleValue> } {
        if (typeof input === 'string') {
            return { html: input, styles: {} };
        }

        defaults = defaults ?? {};

        const {
            text = defaults.text ?? '',
            color = defaults.color,
            backgroundColor = defaults.backgroundColor,
            opacity = defaults.opacity ?? 1,
        } = input;

        const styles: Record<string, StyleValue> = {
            opacity,
            'background-color': backgroundColor?.toLowerCase(),
            color,
        };
        return {
            html: `<div class="ag-charts-crosshair-label-content">
                    <span>${text}</span>
                </div>`,
            styles,
        };
    }
}
