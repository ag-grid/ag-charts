import { type AgCrosshairLabelRendererResult, type _ModuleSupport } from 'ag-charts-community';
import { type Point, createId } from 'ag-charts-core';

const DEFAULT_LABEL_CLASS = 'ag-charts-crosshair-label';
type StyleValue = string | number | undefined;

export class CrosshairLabel {
    static readonly className = 'CrosshairLabel';
    private readonly id = createId(this);
    private readonly elementProxy: _ModuleSupport.DOMElementProxy;

    xOffset: number = 0;
    yOffset: number = 0;

    constructor(
        private readonly domManager: _ModuleSupport.DOMManager,
        key: string,
        axisId: string
    ) {
        this.elementProxy = domManager.addDeferredProxyChild('canvas-overlay', `crosshair-label-${this.id}`);
        this.elementProxy.toggleClass(DEFAULT_LABEL_CLASS, true);
        this.elementProxy.setAttr('aria-hidden', 'true');
        this.elementProxy.setAttr('data-key', key);
        this.elementProxy.setAttr('data-axis-id', axisId);
    }

    show(meta: Point & { translateX?: string; translateY?: string }) {
        const left = Math.round(meta.x + this.xOffset);
        const top = Math.round(meta.y + this.yOffset);

        this.elementProxy.setProperty('left', `${left}px`);
        this.elementProxy.setProperty('top', `${top}px`);

        const translate =
            meta.translateX || meta.translateY ? `${meta.translateX ?? '0'} ${meta.translateY ?? '0'}` : '';
        this.elementProxy.setProperty('translate', translate);

        this.toggle(true);
    }

    setLabelHtml({ html, styles }: { html?: string; styles?: Record<string, StyleValue> }) {
        if (html !== undefined) {
            this.elementProxy.setInnerHTML(html);
        }
        if (styles !== undefined) {
            this.elementProxy.setContentStyles(styles);
        }
    }

    toggle(visible?: boolean) {
        this.elementProxy.toggleClass('ag-charts-crosshair-label--hidden', !visible);
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
