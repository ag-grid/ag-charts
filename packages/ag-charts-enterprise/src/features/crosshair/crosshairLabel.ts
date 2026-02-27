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
import { BaseProperties, type Point, Property, createId } from 'ag-charts-core';

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
    private readonly dom: _ModuleSupport.DOMWriteCache;

    constructor(
        private readonly domManager: _ModuleSupport.DOMManager,
        key: string,
        axisId: string
    ) {
        super();

        const element = domManager.addChild('canvas-overlay', `crosshair-label-${this.id}`);
        this.dom = new _ModuleSupport.DOMWriteCache(element);
        this.dom.toggleClass(DEFAULT_LABEL_CLASS, true);
        this.dom.setAttr('aria-hidden', 'true');
        this.dom.setAttr('data-key', key);
        this.dom.setAttr('data-axis-id', axisId);
    }

    show(meta: Point & { translateX?: string; translateY?: string }) {
        const left = Math.round(meta.x + this.xOffset);
        const top = Math.round(meta.y + this.yOffset);

        this.dom.setProperty('left', `${left}px`);
        this.dom.setProperty('top', `${top}px`);

        const translate =
            meta.translateX || meta.translateY ? `${meta.translateX ?? '0'} ${meta.translateY ?? '0'}` : '';
        this.dom.setProperty('translate', translate);

        this.toggle(true);
    }

    setLabelHtml({ html, styles }: { html?: string; styles?: Record<string, StyleValue> }) {
        if (html !== undefined) {
            this.dom.setInnerHTML(html);
        }
        if (styles !== undefined) {
            this.dom.setContentStyles(styles);
        }
    }

    toggle(visible?: boolean) {
        this.dom.toggleClass('ag-charts-crosshair-label--hidden', !visible);
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
