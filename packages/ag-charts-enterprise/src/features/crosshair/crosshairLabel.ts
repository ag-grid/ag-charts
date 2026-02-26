import type {
    AgCrosshairLabelFormatterParams,
    AgCrosshairLabelRendererParams,
    AgCrosshairLabelRendererResult,
    ContextDefault,
    Formatter,
    FormatterParams,
    TextValue,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, type Point, Property, createId, setAttribute } from 'ag-charts-core';

const { FormatManager } = _ModuleSupport;
const DEFAULT_LABEL_CLASS = 'ag-charts-crosshair-label';
type StyleValue = string | number | undefined;

interface FormatterCache {
    type: string;
    format: string;
    formatter: ((value: any, fractionDigits?: number) => string) | undefined;
}

export class CrosshairLabelProperties
    extends BaseProperties
    implements _ModuleSupport.AxisFormattableLabel<AgCrosshairLabelFormatterParams<ContextDefault>, FormatterParams>
{
    @Property
    enabled: boolean = true;

    @Property
    xOffset: number = 0;

    @Property
    yOffset: number = 0;

    @Property
    formatter?: Formatter<AgCrosshairLabelFormatterParams<ContextDefault>>;

    @Property
    format?: string = undefined;

    @Property
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult = undefined;

    private _cachedFormatter: FormatterCache | undefined = undefined;
    formatValue(
        callWithContext: (
            formatter: (params: AgCrosshairLabelFormatterParams<ContextDefault>) => TextValue | undefined,
            params: AgCrosshairLabelFormatterParams<ContextDefault>
        ) => TextValue | undefined,
        type: 'number' | 'date' | 'category',
        value: any,
        params: FormatterParams<any>
    ) {
        const { formatter, format } = this;
        const { domain, boundSeries } = params;

        let result: TextValue | undefined;
        if (formatter != null) {
            const fractionDigits = params.type === 'number' ? params.fractionDigits : undefined;
            const unit = params.type === 'date' ? params.unit : undefined;
            const step = params.type === 'date' ? params.step : undefined;
            result = callWithContext(formatter, { value, domain, fractionDigits, unit, step, boundSeries });
        }

        if (format != null) {
            let cachedFormatter = this._cachedFormatter;
            if (cachedFormatter?.type !== type || cachedFormatter?.format !== format) {
                cachedFormatter = {
                    type,
                    format,
                    formatter: FormatManager.getFormatter(type, format),
                };
                this._cachedFormatter = cachedFormatter;
            }

            result ??= cachedFormatter.formatter?.(value);
        }

        return result == null ? undefined : String(result);
    }
}

export class CrosshairLabel extends CrosshairLabelProperties {
    static readonly className = 'CrosshairLabel';
    private readonly id = createId(this);
    private readonly element: HTMLElement;

    // DOM write deduplication caches (mirrors tooltip _prev* pattern)
    private _prevHtml: string | undefined;
    private _prevStylesKey: string | undefined;
    private _prevLeft: number | undefined;
    private _prevTop: number | undefined;
    private _prevTranslate: string | undefined;
    private _prevVisible: boolean | undefined;

    constructor(
        private readonly domManager: _ModuleSupport.DOMManager,
        key: string,
        axisId: string
    ) {
        super();

        this.element = domManager.addChild('canvas-overlay', `crosshair-label-${this.id}`);
        this.element.classList.add(DEFAULT_LABEL_CLASS);
        setAttribute(this.element, 'aria-hidden', true);
        this.element.dataset.key = key;
        this.element.dataset.axisId = axisId;
    }

    show(meta: Point & { translateX?: string; translateY?: string }) {
        const left = Math.round(meta.x + this.xOffset);
        const top = Math.round(meta.y + this.yOffset);

        if (this._prevLeft !== left || this._prevTop !== top) {
            this.element.style.left = `${left}px`;
            this.element.style.top = `${top}px`;
            this._prevLeft = left;
            this._prevTop = top;
        }

        const translate =
            meta.translateX || meta.translateY ? `${meta.translateX ?? '0'} ${meta.translateY ?? '0'}` : '';
        if (this._prevTranslate !== translate) {
            this.element.style.translate = translate;
            this._prevTranslate = translate;
        }

        this.toggle(true);
    }

    setLabelHtml({ html, styles }: { html?: string; styles?: Record<string, StyleValue> }) {
        if (html !== undefined && html !== this._prevHtml) {
            this.element.innerHTML = html;
            this._prevHtml = html;
            this._prevStylesKey = undefined;
        }
        if (styles !== undefined) {
            const stylesKey = JSON.stringify(styles);
            if (stylesKey !== this._prevStylesKey) {
                const styleElement = (this.element.children[0] as HTMLElement) ?? this.element;
                Object.assign(styleElement.style, styles);
                this._prevStylesKey = stylesKey;
            }
        }
    }

    toggle(visible?: boolean) {
        if (this._prevVisible !== visible) {
            this.element.classList.toggle(`ag-charts-crosshair-label--hidden`, !visible);
            this._prevVisible = visible;
        }
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
