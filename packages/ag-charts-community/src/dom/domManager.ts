import type { AgIconName } from 'ag-charts-types';

import { BaseManager } from '../chart/baseManager';
import { BBox } from '../scene/bbox';
import STYLES from '../styles.css';
import { setAttribute } from '../util/attributeUtil';
import { createElement, getDocument, getWindow } from '../util/dom';
import { stopPageScrolling } from '../util/keynavUtil';
import { type Size, SizeMonitor } from '../util/sizeMonitor';
// TODO move to utils
import BASE_DOM from './domLayout.html';

/* eslint-disable sonarjs/no-duplicate-string */
const DOM_ELEMENT_CLASSES = [
    'styles',
    'canvas',
    'canvas-center',
    'canvas-overlay',
    'canvas-proxy',
    'series-area',
] as const;
type DOMElementClass = (typeof DOM_ELEMENT_CLASSES)[number];
type DOMElementConfig = { childElementType: 'style' | 'canvas' | 'div'; style?: Partial<CSSStyleDeclaration> };
type DOMInsertOption = { where: InsertPosition; query: string };

const domElementConfig: Map<DOMElementClass, DOMElementConfig> = new Map([
    ['styles', { childElementType: 'style' }],
    ['canvas', { childElementType: 'canvas' }],
    ['canvas-proxy', { childElementType: 'div' }],
    ['canvas-overlay', { childElementType: 'div' }],
    ['canvas-center', { childElementType: 'div' }],
    ['series-area', { childElementType: 'div' }],
]);

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
    private readonly styles = new Map<string, string>();
    private readonly element: HTMLElement;
    private readonly styleRootElement?: HTMLElement;
    private container?: HTMLElement = undefined;
    containerSize?: Size = undefined;

    private readonly observer?: IntersectionObserver;
    private readonly sizeMonitor = new SizeMonitor();

    constructor(container?: HTMLElement, styleContainer?: HTMLElement) {
        super();

        const templateEl = createElement('div');
        templateEl.innerHTML = BASE_DOM;
        this.element = templateEl.children.item(0) as HTMLElement;
        this.styleRootElement = styleContainer;

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

        this.destroyFns.push(stopPageScrolling(this.element));
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

        this.element.remove();
    }

    setSizeOptions(minWidth: number = 300, minHeight: number = 300, optionsWidth?: number, optionsHeight?: number) {
        const { style } = this.element;

        style.width = `${optionsWidth ?? minWidth}px`;
        style.height = `${optionsHeight ?? minHeight}px`;
    }

    private updateContainerSize() {
        const { style: centerStyle } = this.rootElements['canvas-center'].element;

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

        this.container = newContainer;

        // If we moved from a shadow DOM to outside, we need to ensure the page styles are present
        // Or if the container is added lazily, we need to ensure styles are added before the container
        // This is a no-op if styles already exist
        for (const [id, styles] of this.styles) {
            this.addStyles(id, styles);
        }

        newContainer.appendChild(this.element);
        this.sizeMonitor.observe(newContainer, (size) => {
            this.containerSize = size;
            this.updateContainerSize();
            this.listeners.dispatch('resize', { type: 'resize' });
        });

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

    setTabIndex(tabIndex: number /* FIXME: type should be 0 | -1 */) {
        this.rootElements['series-area'].element.tabIndex = tabIndex;
    }

    updateCanvasLabel(ariaLabel: string) {
        setAttribute(this.rootElements['canvas-proxy'].element, 'aria-label', ariaLabel);
    }

    private getEventElement<K extends keyof HTMLElementEventMap>(defaultElem: HTMLElement, eventType: K) {
        // For now, the only element managed by DOMManager that is focusable is 'series-area'
        const events = ['focus', 'blur', 'keydown', 'keyup'];
        return events.includes(eventType) ? this.rootElements['series-area'].element : defaultElem;
    }

    addEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ) {
        this.getEventElement(this.element, type).addEventListener(type, listener, options);
    }

    removeEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ) {
        this.getEventElement(this.element, type).removeEventListener(type, listener, options);
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

    getShadowDocumentRoot(current = this.container, usecase: 'styles' | 'NA' = 'NA') {
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

        // Container is disconnected from the DOM, default to the
        if (usecase === 'styles') {
            return this.container;
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
        const dataAttribute = 'data-ag-charts';

        this.styles.set(id, styles);

        if (this.container == null) return;

        const checkId = (el: Element) => {
            return el.getAttribute(dataAttribute) === id;
        };

        const addStyleElement = (el: HTMLElement) => {
            for (const child of el.children as any as Iterable<Element>) {
                if (checkId(child)) return;
            }

            const styleEl = createElement('style');
            el.appendChild(styleEl);
            return styleEl;
        };

        let styleElement: HTMLElement | undefined;
        if (this.styleRootElement) {
            // AG-13233 - User supplied root element, don't use heuristics.
            styleElement = addStyleElement(this.styleRootElement);
        } else {
            // Heuristic detection of enclosing shadow DOM root.
            const documentRoot = this.getShadowDocumentRoot(this.container, 'styles');
            if (documentRoot != null) {
                // Add to our DOM tree to avoid contaminating outside of the shadow DOM.
                styleElement = this.addChild('styles', id);
            } else {
                // Add to document head as failsafe fallback.
                styleElement = addStyleElement(getDocument('head'));
            }
        }

        // Avoid setting innerHTML on elements we've already configured to avoid style recalculations
        if (styleElement == null || checkId(styleElement)) return;

        styleElement.setAttribute(dataAttribute, id);
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

    addChild(domElementClass: DOMElementClass, id: string, child?: HTMLElement, insert?: DOMInsertOption) {
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
        if (insert) {
            const queryResult = element.querySelector(insert.query);
            if (queryResult == null) {
                throw new Error(`AG Charts - addChild query failed ${insert.query}`);
            }
            queryResult.insertAdjacentElement(insert.where, newChild);
        } else {
            element?.appendChild(newChild);
        }
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

    setDataBoolean(name: string, value: boolean) {
        this.element.dataset[name] = String(value);
    }

    getIconClassNames(icon: AgIconName) {
        return `ag-charts-icon ag-charts-icon-${icon}`;
    }
}
