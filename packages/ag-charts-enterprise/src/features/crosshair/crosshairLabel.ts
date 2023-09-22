import { _ModuleSupport, _Scene } from 'ag-charts-community';

type AgCrosshairLabelRendererParams = any;
type AgCrosshairLabelRendererResult = any;

const { ActionOnSet, Validate, NUMBER, BOOLEAN, OPT_STRING, OPT_FUNCTION } = _ModuleSupport;
const { BBox } = _Scene;

export const defaultLabelCss = `
.ag-crosshair-label {
    position: absolute;
    left: 0px;
    top: 0px;
    user-select: none;
    pointer-events: none;
    border-radius: 2px;
    font: 12px Verdana, sans-serif;
    box-shadow: 0 1px 3px rgb(0 0 0 / 20%), 0 1px 1px rgb(0 0 0 / 14%);
    line-height: 1.7em;
    overflow: hidden;
    white-space: nowrap;
    z-index: 99999;
    background-color: rgb(255, 255, 255);
    color: rgba(87, 87, 87, 1);
}

.ag-crosshair-label-content {
    padding: 0 7px;
    opacity: 1;
}

.ag-crosshair-label-title {
    padding-left: 7px;
    opacity: 1;
}

.ag-crosshair-label-hidden {
    top: -10000px !important;
}

.ag-crosshair-label {
    box-sizing: border-box;
    overflow: hidden;
}
`;

export interface LabelMeta {
    x: number;
    y: number;
}

export const DEFAULT_LABEL_CLASS = 'ag-crosshair-label';

export class CrosshairLabel {
    private static labelDocuments: Document[] = [];
    private readonly element: HTMLElement;

    private readonly labelRoot: HTMLElement;

    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(OPT_STRING)
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
    className?: string = undefined;

    @Validate(NUMBER())
    xOffset: number = 0;

    @Validate(NUMBER())
    yOffset: number = 0;

    @Validate(OPT_STRING)
    format?: string = undefined;

    @Validate(OPT_FUNCTION)
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult = undefined;

    constructor(document: Document, container: HTMLElement) {
        this.labelRoot = container;
        const element = document.createElement('div');
        this.element = this.labelRoot.appendChild(element);
        this.element.classList.add(DEFAULT_LABEL_CLASS);

        if (CrosshairLabel.labelDocuments.indexOf(document) < 0) {
            const styleElement = document.createElement('style');
            styleElement.innerHTML = defaultLabelCss;
            // Make sure the default label style goes before other styles so it can be overridden.
            document.head.insertBefore(styleElement, document.head.querySelector('style'));
            CrosshairLabel.labelDocuments.push(document);
        }
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

        element.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;

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
        const { width, height } = this.labelRoot.getBoundingClientRect();
        return new BBox(0, 0, width, height);
    }

    toggle(visible?: boolean) {
        this.element.classList.toggle(`${DEFAULT_LABEL_CLASS}-hidden`, !visible);
    }

    destroy() {
        const { parentNode } = this.element;

        if (parentNode) {
            parentNode.removeChild(this.element);
        }
    }

    toLabelHtml(input: string | AgCrosshairLabelRendererResult, defaults?: AgCrosshairLabelRendererResult): string {
        if (typeof input === 'string') {
            return input;
        }

        defaults = defaults ?? {};

        const {
            text = defaults.text ?? '',
            color = defaults.color,
            backgroundColor = undefined,
            opacity = defaults.opacity ?? 1,
        } = input;

        let contentHtml;

        if (color) {
            contentHtml = `<span class="${DEFAULT_LABEL_CLASS}-content" style="color: ${color}">${text}</span>`;
        } else {
            contentHtml = `<span class="${DEFAULT_LABEL_CLASS}-content">${text}</span>`;
        }

        let style = `opacity: ${opacity}`;
        if (backgroundColor) {
            style += `; background-color: ${backgroundColor.toLowerCase()}`;
        }

        return `<div class="${DEFAULT_LABEL_CLASS}-wrapper" style="${style}">
                    ${contentHtml}
                </div>`;
    }
}
