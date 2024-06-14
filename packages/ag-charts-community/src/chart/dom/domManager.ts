import { BBox } from '../../scene/bbox';
import { createElement, getDocument } from '../../util/dom';
import { GuardedElement } from '../../util/guardedElement';
import { type Size, SizeMonitor } from '../../util/sizeMonitor';
import { BaseManager } from '../baseManager';

const CANVAS_CENTER_CLASS = 'canvas-center';
const DOM_ELEMENT_CLASSES = ['styles', CANVAS_CENTER_CLASS, 'canvas', 'canvas-overlay'] as const;
export type DOMElementClass = (typeof DOM_ELEMENT_CLASSES)[number];

type DOMElementConfig = {
    childElementType: 'style' | 'canvas' | 'div';
    style?: Partial<CSSStyleDeclaration>;
    eventTypes?: string[];
};

const domElementConfig: Map<DOMElementClass, DOMElementConfig> = new Map([
    ['styles', { childElementType: 'style' }],
    ['canvas', { childElementType: 'canvas', eventTypes: ['focus', 'blur'] }],
    ['canvas-overlay', { childElementType: 'div' }],
    [CANVAS_CENTER_CLASS, { childElementType: 'div' }],
]);

const STYLES = `
.ag-charts-wrapper {
    position: relative;
}

.ag-charts-canvas-center {
    width: 100%;
    height: 100%;

    position: absolute;
    touch-action: auto;

    display: flex;
    align-items: var(--ag-charts-align);
    justify-content: var(--ag-charts-justify);
}

.ag-charts-canvas-container, .ag-charts-canvas {
    position: relative;
}

.ag-charts-canvas-container > *, , .ag-charts-canvas > * {
    display: block;
}

.ag-charts-tab-guard {
    opacity: 0;
    width: 0px;
    height: 0px;
}

.ag-charts-canvas-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.ag-charts-canvas-overlay > * {
    position: absolute;
}
`;

const BASE_DOM = `
<div class="ag-charts-wrapper ag-charts-styles" data-ag-charts>
    <div class="ag-charts-canvas-center">
        <div class="ag-charts-canvas-container">
            <div class="ag-charts-tab-guard"></div>
            <div class="ag-charts-canvas"></div>
            <div class="ag-charts-tab-guard"></div>
            <div class="ag-charts-canvas-overlay"></div>
        </div>
    </div>
</div>
`;

function setupObserver(element: HTMLElement, cb: (intersectionRatio: number) => void) {
    // Detect when the chart becomes invisible and hide the tooltip as well.
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.target === element) {
                    cb(entry.intersectionRatio);
                }
            }
        },
        { root: element }
    );
    observer.observe(element);
    return observer;
}

type Events = { type: 'hidden' } | { type: 'resize'; size: Size } | { type: 'container-changed' };
type LiveDOMElement = {
    element: HTMLElement;
    children: Map<string, HTMLElement>;
    listeners: [string, Function, boolean | AddEventListenerOptions | undefined][];
};

export class DOMManager extends BaseManager<Events['type'], Events> {
    private readonly rootElements: Record<DOMElementClass, LiveDOMElement>;
    private readonly element: HTMLElement;
    private container?: HTMLElement;
    private containerSize?: Size;

    public guardedElement?: GuardedElement;

    private readonly observer?: IntersectionObserver;
    private readonly sizeMonitor = new SizeMonitor();

    constructor(container?: HTMLElement) {
        super();

        const templateEl = createElement('div');
        templateEl.innerHTML = BASE_DOM;
        this.element = templateEl.children.item(0) as HTMLElement;

        this.rootElements = DOM_ELEMENT_CLASSES.reduce(
            (r, c) => {
                const cssClass = `ag-charts-${c}`;
                const el = this.element.classList.contains(cssClass)
                    ? this.element
                    : (this.element.querySelector(`.${cssClass}`) as HTMLElement);

                if (!el) throw new Error(`AG Charts - unable to find DOM element ${cssClass}`);

                r[c] = { element: el, children: new Map<string, HTMLElement>(), listeners: [] };
                return r;
            },
            {} as typeof this.rootElements
        );

        let hidden = false;
        this.observer = setupObserver(this.element, (intersectionRatio) => {
            if (intersectionRatio === 0 && !hidden) {
                this.listeners.dispatch('hidden', { type: 'hidden' });
            }
            hidden = intersectionRatio === 0;
        });

        this.setSizeOptions();

        this.addStyles('dom-manager', STYLES);

        if (container) {
            this.setContainer(container);
        }
    }

    override destroy() {
        super.destroy();

        this.observer?.unobserve(this.element);
        if (this.container) {
            this.sizeMonitor.unobserve(this.container);
        }

        Object.values(this.rootElements).forEach((el) => {
            el.children.forEach((c) => c.remove());
            el.element.remove();
        });

        this.guardedElement?.destroy();
        this.element.remove();
    }

    setSizeOptions(minWidth: number = 300, minHeight: number = 300, optionsWidth?: number, optionsHeight?: number) {
        const { style } = this.element;

        style.width = `${optionsWidth ?? minWidth}px`;
        style.height = `${optionsHeight ?? minHeight}px`;
    }

    private updateContainerSize() {
        const { style: centerStyle } = this.rootElements[CANVAS_CENTER_CLASS].element;

        centerStyle.width = `${this.containerSize?.width ?? 0}px`;
        centerStyle.height = `${this.containerSize?.height ?? 0}px`;
    }

    setContainer(newContainer: HTMLElement) {
        if (newContainer === this.container) return;

        if (this.container) {
            this.container.removeChild(this.element);
            this.sizeMonitor.unobserve(this.container);
        }
        newContainer.appendChild(this.element);
        this.sizeMonitor.observe(newContainer, (size) => {
            this.containerSize = size;
            this.updateContainerSize();
            this.listeners.dispatch('resize', { type: 'resize', size });
        });

        this.container = newContainer;

        this.listeners.dispatch('container-changed', { type: 'container-changed' });
    }

    setThemeClass(themeClassName: string) {
        const themeClassNamePrefix = 'ag-charts-theme-';

        this.element.classList.forEach((className) => {
            if (className.startsWith(themeClassNamePrefix) && className !== themeClassName) {
                this.element.classList.remove(className);
            }
        });

        this.element.classList.add(themeClassName);
    }

    private createTabGuards(): GuardedElement {
        const canvasElement = this.rootElements['canvas'].element.querySelector<HTMLCanvasElement>('canvas');
        const tabGuards = this.element.querySelectorAll<HTMLElement>('.ag-charts-tab-guard');
        if (canvasElement == null || tabGuards[0] == null || tabGuards[1] == null) {
            throw new Error('AG Charts - error initialising canvas tab guards');
        }
        return new GuardedElement(canvasElement, tabGuards[0], tabGuards[1]);
    }

    setTabIndex(tabIndex: number) {
        this.guardedElement ??= this.createTabGuards();
        this.guardedElement.tabIndex = tabIndex;
    }

    getBrowserFocusDelta(): -1 | 0 | 1 {
        return this.guardedElement?.getBrowserFocusDelta() ?? 0;
    }

    addEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ) {
        this.element.addEventListener(type, listener, options);

        domElementConfig.forEach((config, elType) => {
            if (!config.eventTypes?.includes(type)) return;

            const els = this.rootElements[elType];
            els.listeners.push([type, listener, options]);
            els.children.forEach((el) => {
                el.addEventListener(type, listener);
            });
        });
    }

    removeEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ) {
        this.element.removeEventListener(type, listener, options);

        domElementConfig.forEach((config, elType) => {
            if (!config.eventTypes?.includes(type)) return;

            const els = this.rootElements[elType];
            els.listeners = els.listeners.filter(([t, l]) => t !== type && l !== listener);
            els.children.forEach((el) => {
                el.removeEventListener(type, listener, options);
            });
        });
    }

    getBoundingClientRect() {
        return this.rootElements['canvas'].element.getBoundingClientRect();
    }

    getDocumentRoot() {
        const docRoot = this.container?.ownerDocument?.body ?? getDocument('body');
        let parent = this.container;

        // For shadow-DOM cases, the root node of the shadow-DOM has no parent - we need
        // to attach listeners etc.. to that node, not the document body.
        while (parent != null) {
            if (parent === docRoot) {
                return docRoot;
            }
            if (parent.parentNode instanceof DocumentFragment) {
                // parentNode is a Shadow DOM.
                return parent;
            }
            if (parent.parentNode == null) {
                // Node is not attached to the DOM, fallback to docRoot.
                return docRoot;
            }

            parent = parent.parentNode as HTMLElement;
        }

        return docRoot;
    }

    getChildBoundingClientRect(type: DOMElementClass) {
        const { children } = this.rootElements[type];

        const childRects: BBox[] = [];
        for (const child of children.values()) {
            childRects.push(BBox.fromDOMRect(child.getBoundingClientRect()));
        }

        return BBox.merge(childRects);
    }

    calculateCanvasPosition(el: HTMLElement) {
        let x = 0;
        let y = 0;

        const { x: cx = 0, y: cy = 0 } = this.getChildBoundingClientRect('canvas') ?? {};
        const elRect = el.getBoundingClientRect();
        x = elRect.x - cx;
        y = elRect.y - cy;

        return { x, y };
    }

    isManagedDOMElement(el: HTMLElement, container = this.element) {
        while (el && el !== container) {
            if (el.parentElement == null) return false;
            el = el.parentElement;
        }

        return true;
    }

    isManagedChildDOMElement(el: HTMLElement, domElementClass: DOMElementClass, id: string) {
        const { children } = this.rootElements[domElementClass];

        const search = children?.get(id);
        return search != null && this.isManagedDOMElement(el, search);
    }

    isEventOverElement(event: Event | MouseEvent | TouchEvent) {
        let element = event.target;

        if (element == null) return false;

        while (element !== this.element) {
            element = (element as HTMLElement).parentElement;
            if (element == null) return false;
        }

        return true;
    }

    addStyles(id: string, styles: string) {
        const styleElement = this.addChild('styles', id);
        styleElement.innerHTML = styles;
    }

    removeStyles(id: string) {
        this.removeChild('styles', id);
    }

    updateCursor(style: string) {
        this.element.style.cursor = style;
    }

    getCursor() {
        return this.element.style.cursor;
    }

    addChild(domElementClass: DOMElementClass, id: string, child?: HTMLElement) {
        const { element, children, listeners } = this.rootElements[domElementClass];
        if (!children) {
            throw new Error('AG Charts - unable to create DOM elements after destroy()');
        }

        if (children.has(id)) return children.get(id)!;

        const { childElementType = 'div' } = domElementConfig.get(domElementClass) ?? {};
        if (child && child.tagName.toLowerCase() !== childElementType.toLowerCase()) {
            throw new Error('AG Charts - mismatching DOM element type');
        }

        const newChild = child ?? createElement(childElementType);
        for (const [type, fn, opts] of listeners) {
            newChild.addEventListener(type, fn as any, opts);
        }
        children.set(id, newChild);
        element?.appendChild(newChild);
        return newChild;
    }

    removeChild(domElementClass: DOMElementClass, id: string) {
        const { children } = this.rootElements[domElementClass];
        if (!children) return;

        if (!children.has(id)) return;

        children.get(id)?.remove();
        children.delete(id);
    }
}
