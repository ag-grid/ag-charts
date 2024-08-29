import type { AgIconName } from 'ag-charts-types';

import { BaseManager } from '../chart/baseManager';
import { BBox } from '../scene/bbox';
import STYLES from '../styles.css';
import { createElement, getDocument, getWindow } from '../util/dom';
import { type Size, SizeMonitor } from '../util/sizeMonitor';
// TODO move to utils
import BASE_DOM from './domLayout.html';

const CANVAS_CENTER_CLASS = 'canvas-center';
const DOM_ELEMENT_CLASSES = ['styles', CANVAS_CENTER_CLASS, 'canvas', 'canvas-proxy', 'canvas-overlay'] as const;
export type DOMElementClass = (typeof DOM_ELEMENT_CLASSES)[number];

type DOMElementConfig = {
    childElementType: 'style' | 'canvas' | 'div' | 'p';
    style?: Partial<CSSStyleDeclaration>;
    eventTypes?: string[];
};

const domElementConfig: Map<DOMElementClass, DOMElementConfig> = new Map([
    ['styles', { childElementType: 'style' }],
    ['canvas', { childElementType: 'canvas', eventTypes: ['focus', 'blur'] }],
    ['canvas-proxy', { childElementType: 'div' }],
    ['canvas-overlay', { childElementType: 'div' }],
    [CANVAS_CENTER_CLASS, { childElementType: 'div' }],
]);

const overlayNonBubblingEvents = ['keyup', 'mousedown', 'mouseup', 'click'];
const overlayStopPropagation = (ev: Event) => ev.stopPropagation();

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

type Events = { type: 'hidden' } | { type: 'resize' } | { type: 'container-changed' };
type LiveDOMElement = {
    element: HTMLElement;
    children: Map<string, HTMLElement>;
    listeners: [string, Function, boolean | AddEventListenerOptions | undefined][];
};

const NULL_DOMRECT: DOMRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    toJSON() {
        return NULL_DOMRECT;
    },
};

export class DOMManager extends BaseManager<Events['type'], Events> {
    private readonly rootElements: Record<DOMElementClass, LiveDOMElement>;
    private styles: Record<string, string> = {};
    private readonly element: HTMLElement;
    private container?: HTMLElement = undefined;
    containerSize?: Size = undefined;

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

        this.addStyles('ag-charts-community', STYLES);

        if (container) {
            this.setContainer(container);
        }

        const overlay = this.element.querySelector('.ag-charts-canvas-overlay') as HTMLElement | null;
        if (overlay != null) {
            for (const type of overlayNonBubblingEvents) {
                overlay.addEventListener(type, overlayStopPropagation);
            }
        }
    }

    override destroy() {
        super.destroy();
        const overlay = this.element.querySelector('.ag-charts-canvas-overlay') as HTMLElement | null;
        if (overlay != null) {
            for (const type of overlayNonBubblingEvents) {
                overlay.removeEventListener(type, overlayStopPropagation);
            }
        }

        this.observer?.unobserve(this.element);
        if (this.container) {
            this.sizeMonitor.unobserve(this.container);
        }

        Object.values(this.rootElements).forEach((el) => {
            el.children.forEach((c) => c.remove());
            el.element.remove();
        });

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

        const isShadowDom = this.getShadowDocumentRoot(newContainer) != null;

        // If the container was inside a shadow DOM, the styles are added to the container rather than the head
        //
        // If we change the container from inside a shadow DOM to outside, we need to remove these styles, because they
        // can cause conflicts
        //
        // Conversely, if we go from outside to inside a shadow DOM, it's probably not safe to remove the styles from
        // the head, because other charts may be depending on them
        //
        // Note we do this before relocating the new container to avoid temporarily adding new styles to the page,
        // which may cause a style recalculation
        if (!isShadowDom) {
            for (const id of this.rootElements['styles'].children.keys()) {
                this.removeChild('styles', id);
            }
        }

        newContainer.appendChild(this.element);
        this.sizeMonitor.observe(newContainer, (size) => {
            this.containerSize = size;
            this.updateContainerSize();
            this.listeners.dispatch('resize', { type: 'resize' });
        });

        this.container = newContainer;

        // If we moved from a shadow DOM to outside, we need to ensure the page styles are present
        // This is a no-op if styles already exist
        for (const [id, styles] of Object.entries(this.styles)) {
            this.addStyles(id, styles);
        }

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

    setTabIndex(tabIndex: number) {
        const canvasElement = this.rootElements['canvas'].element.querySelector<HTMLCanvasElement>('canvas');
        if (canvasElement) {
            canvasElement.tabIndex = tabIndex;
        }
    }

    addEventListenerOnElement<K extends keyof HTMLElementEventMap>(
        elementType: DOMElementClass,
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ) {
        const { element } = this.rootElements[elementType];
        element.addEventListener(type, listener, options);
        return () => {
            element.removeEventListener(type, listener, options);
        };
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

    /** Get the main chart area client bound rect. */
    getBoundingClientRect() {
        return this.rootElements['canvas'].element.getBoundingClientRect();
    }

    /**
     * Get the client bounding rect for overlay elements that might float outside the bounds of the
     * main chart area.
     */
    getOverlayClientRect() {
        const window = getWindow();
        const windowBBox = new BBox(0, 0, window.innerWidth, window.innerHeight);
        const container = this.getRawOverlayClientRect();

        const containerBBox = BBox.fromDOMRect(container ?? this.getBoundingClientRect());
        return windowBBox.intersection(containerBBox)?.toDOMRect() ?? NULL_DOMRECT;
    }

    private getRawOverlayClientRect() {
        let element: HTMLElement | null = this.element;

        // Try and find a parent which will clip rendering of children - if found we should restrict
        // to that elements bounding box.
        while (element != null) {
            const styleMap = element.computedStyleMap?.();
            const overflowX = styleMap?.get('overflow-x')?.toString();
            const overflowY = styleMap?.get('overflow-y')?.toString();

            if ((overflowX != null && overflowX !== 'visible') || (overflowY && overflowY !== 'visible')) {
                return element.getBoundingClientRect();
            }

            element = element.parentElement;
        }

        // If in a shadow-DOM case, use the shadow-DOMs bounding-box, intersected with the window
        // viewport.
        const docRoot = this.getShadowDocumentRoot();
        if (docRoot) {
            return docRoot.getBoundingClientRect();
        }
    }

    getShadowDocumentRoot(current = this.container) {
        const docRoot = current?.ownerDocument?.body ?? getDocument('body');

        // For shadow-DOM cases, the root node of the shadow-DOM has no parent - we need
        // to attach listeners etc.. to that node, not the document body.
        while (current != null) {
            if (current === docRoot) {
                return undefined;
            }
            if (current.parentNode instanceof DocumentFragment) {
                // parentNode is a Shadow DOM.
                return current;
            }

            current = current.parentNode as HTMLElement;
        }

        return undefined;
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

    isManagedChildDOMElement(el: HTMLElement, domElementClass: DOMElementClass, id: string) {
        const { children } = this.rootElements[domElementClass];

        const search = children?.get(id);
        return search != null && el.contains(search);
    }

    isEventOverElement(event: Event | MouseEvent | TouchEvent) {
        const element = event.target as HTMLElement | null;
        return element != null && this.element.contains(element);
    }

    addStyles(id: string, styles: string) {
        this.styles[id] = styles;

        if (this.container == null) return;

        const dataAttribute = 'data-ag-charts';
        const documentRoot = this.getShadowDocumentRoot();
        let styleElement: HTMLElement;
        if (documentRoot != null) {
            styleElement = this.addChild('styles', id);
        } else {
            const head = getDocument('head');

            for (const child of head.children as any as Iterable<Element>) {
                if (child.getAttribute(dataAttribute) === id) return;
            }

            styleElement = createElement('style');
            head.appendChild(styleElement);
        }

        if (styleElement.getAttribute(dataAttribute) === id) {
            // Avoid setting innerHTML on elements we've already configured to avoid style recalculations
            return;
        }

        styleElement.setAttribute(dataAttribute, id);
        styleElement.innerHTML = styles;
    }

    removeStyles(id: string) {
        this.removeChild('styles', id);
    }

    focus() {
        for (const child of this.rootElements.canvas.children.values()) {
            child.focus();
            return;
        }
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
        if (children.has(id)) {
            return children.get(id)!;
        }

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

        children.get(id)?.remove();
        children.delete(id);
    }

    incrementDataCounter(name: string) {
        const { dataset } = this.element;
        dataset[name] ??= '0';
        dataset[name] = String(Number(dataset[name]) + 1);
    }

    getIconClassNames(icon: AgIconName) {
        return `ag-charts-icon ag-charts-icon-${icon}`;
    }
}
