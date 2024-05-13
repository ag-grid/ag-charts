import type { AgCrosshairLabelRendererParams, AgCrosshairLabelRendererResult } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { ActionOnSet, BaseProperties, BOOLEAN, FUNCTION, NUMBER, STRING, Validate } = _ModuleSupport;
const { setAttribute } = _Util;
const { BBox } = _Scene;

const DEFAULT_LABEL_CLASS = 'ag-crosshair-label';

export const defaultLabelCss = `
.${DEFAULT_LABEL_CLASS} {
    position: absolute;
    left: 0px;
    top: 0px;
    user-select: none;
    pointer-events: none;
    font: 12px Verdana, sans-serif;
    overflow: hidden;
    white-space: nowrap;
    z-index: 99998; // Needs to be below tooltips!
    box-sizing: border-box;
}

.${DEFAULT_LABEL_CLASS}-content {
    padding: 0 7px;
    border-radius: 2px;
    line-height: 1.7em;
    background-color: rgb(71,71,71);
    color: rgb(255, 255, 255);
}

.${DEFAULT_LABEL_CLASS}-hidden {
    top: -10000px !important;
}
`;

export interface LabelMeta {
    x: number;
    y: number;
}

export class CrosshairLabelProperties extends _Scene.ChangeDetectableProperties {
    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(STRING, { optional: true })
    className?: string;

    @Validate(NUMBER)
    xOffset: number = 0;

    @Validate(NUMBER)
    yOffset: number = 0;

    @Validate(STRING, { optional: true })
    format?: string = undefined;

    @Validate(FUNCTION, { optional: true })
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult = undefined;
}

export class CrosshairLabel extends BaseProperties {
    private readonly id = _Util.createId(this);

    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(STRING, { optional: true })
    @ActionOnSet<CrosshairLabel>({
        changeValue(newValue, oldValue) {
            if (newValue !== oldValue) {
                if (oldValue) {
                    this.element.classList.remove(oldValue);
                }
                if (newValue) {
                    this.element.classList.add(newValue);
                }
            }
        },
    })
    className?: string;

    @Validate(NUMBER)
    xOffset: number = 0;

    @Validate(NUMBER)
    yOffset: number = 0;

    @Validate(STRING, { optional: true })
    format?: string;

    @Validate(FUNCTION, { optional: true })
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult = undefined;

    private readonly element: HTMLElement;

    constructor(private readonly domManager: _ModuleSupport.DOMManager) {
        super();

        this.element = domManager.addChild('canvas-overlay', `crosshair-label-${this.id}`);
        this.element.classList.add(DEFAULT_LABEL_CLASS);
        setAttribute(this.element, 'aria-hidden', true);

        this.domManager.addStyles('crosshair-labels', defaultLabelCss);
    }

    show(meta: LabelMeta) {
        const { element } = this;

        let left = meta.x + this.xOffset;
        let top = meta.y + this.yOffset;

        const limit = (low: number, actual: number, high: number) => {
            return Math.max(Math.min(actual, high), low);
        };

        const containerBounds = this.getContainerBoundingBox();
        const maxLeft = containerBounds.x + containerBounds.width - element.clientWidth - 1;
        const maxTop = containerBounds.y + containerBounds.height - element.clientHeight;

        left = limit(containerBounds.x + 1, left, maxLeft);
        top = limit(containerBounds.y, top, maxTop);

        element.style.top = `${Math.round(top)}px`;
        element.style.left = `${Math.round(left)}px`;

        this.toggle(true);
    }

    setLabelHtml(html?: string) {
        if (html !== undefined) {
            this.element.innerHTML = html;
        }
    }

    computeBBox(): _Scene.BBox {
        const { element } = this;
        return new _Scene.BBox(element.clientLeft, element.clientTop, element.clientWidth, element.clientHeight);
    }

    private getContainerBoundingBox(): _Scene.BBox {
        const { width, height } = this.domManager.getBoundingClientRect();
        return new BBox(0, 0, width, height);
    }

    toggle(visible?: boolean) {
        this.element.classList.toggle(`${DEFAULT_LABEL_CLASS}-hidden`, !visible);
    }

    destroy() {
        this.domManager.removeChild('canvas-overlay', `crosshair-label-${this.id}`);
    }

    toLabelHtml(input: string | AgCrosshairLabelRendererResult, defaults?: AgCrosshairLabelRendererResult): string {
        if (typeof input === 'string') {
            return input;
        }

        defaults = defaults ?? {};

        const {
            text = defaults.text ?? '',
            color = defaults.color,
            backgroundColor = defaults.backgroundColor,
            opacity = defaults.opacity ?? 1,
        } = input;

        const style = `opacity: ${opacity}; background-color: ${backgroundColor?.toLowerCase()}; color: ${color}`;
        return `<div class="${DEFAULT_LABEL_CLASS}-content" style="${style}">
                    <span>${text}</span>
                </div>`;
    }
}
