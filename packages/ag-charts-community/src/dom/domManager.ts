import {
    AgDocument,
    type StrictHTMLElement,
    attachListener,
    createElement,
    createId,
    entries,
    isDocumentFragment,
    kebabCase,
    setAttribute,
    stopPageScrolling,
} from 'ag-charts-core';
import type { AgChartThemeParams } from 'ag-charts-types';

import type { EventsHub } from '../core/eventsHub';
import { BBox } from '../scene/bbox';
import STYLES from '../styles.css';
import { BaseManager } from '../util/baseManager';
import { GuardedElement } from '../util/guardedElement';
import { type Size, SizeMonitor } from '../util/sizeMonitor';
import { StateTracker } from '../util/stateTracker';
import NORMAL_DOM from './domLayout.html';

const DOM_ELEMENT_CLASSES = [
    'styles',
    'canvas',
    'canvas-background',
    'canvas-center',
    'canvas-container',
    'canvas-overlay',
    'canvas-proxy',
    'series-area',
    'tooltip-container',
] as const;
const MINIMAL_DOM_ELEMENT_ROLES = new Set(['styles', 'canvas-container', 'canvas', 'tooltip-container']);
const CONTAINER_MODIFIERS = {
    safeHorizontal: 'ag-charts-wrapper--safe-horizontal',
    safeVertical: 'ag-charts-wrapper--safe-vertical',
};
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
    ['tooltip-container', { childElementType: 'div' }],
]);

function setupObserver(agDocument: AgDocument, element: HTMLElement, cb: (intersectionRatio: number) => void) {
    // Detect when the chart becomes invisible and hide the tooltip as well.
    const observer = agDocument.createIntersectionObserver(
        (observedEntries) => {
            for (const entry of observedEntries) {
                if (entry.target === element) {
                    cb(entry.intersectionRatio);
                }
            }
        },
        { root: element }
    );
    observer?.observe(element);
    return observer;
}

type LiveDOMElement = {
    element: HTMLElement;
    children: Map<string, StrictHTMLElement>;
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

function createTabGuardElement(guardedElem: HTMLElement, where: 'beforebegin' | 'afterend') {
    const div = createElement('div');
    div.className = 'ag-charts-tab-guard';
    guardedElem.insertAdjacentElement(where, div);
    return div;
}

export class DOMManager extends BaseManager {
    static readonly className = 'DOMManager';
    private static readonly batchedUpdateContainer: DOMManager[] = [];
    private static readonly headStyles = new Set<string>();

    readonly anchorName = `--${createId(this)}`;

    private readonly rootElements: Record<DOMElementClass, LiveDOMElement>;
    private readonly styles = new Map<string, string>();
    private readonly element: HTMLElement;
    private pendingContainer?: HTMLElement = undefined;
    private container?: HTMLElement = undefined;
    private documentRoot?: HTMLElement = undefined;
    private initiallyConnected?: boolean = undefined;
    containerSize?: Size = undefined;
    private readonly tabGuards?: GuardedElement;

    private readonly observer?: IntersectionObserver;
    private readonly sizeMonitor: SizeMonitor;
    private readonly cursorState = new StateTracker('default');

    private minWidth: number = 0;
    private minHeight: number = 0;

    private _cachedCanvasRect: DOMRect | undefined;
    private _cachedRawOverlayRect: BBox | undefined;
    private _cachedScrollableContainer: HTMLElement | null | undefined;

    constructor(
        private readonly eventsHub: EventsHub,
        private readonly chart: { styleNonce?: string },
        private readonly agDocument: AgDocument,
        initialContainer?: HTMLElement,
        private readonly styleContainer?: HTMLElement,
        private readonly skipCss?: boolean,
        readonly mode: 'normal' | 'minimal' = 'normal'
    ) {
        super();

        this.sizeMonitor = new SizeMonitor(agDocument);

        this.element = this.initDOM();
        this.rootElements = this.initRootElements();

        this.rootElements['canvas'].element.style.setProperty('anchor-name', this.anchorName);

        let hidden = false;
        this.observer = setupObserver(agDocument, this.element, (intersectionRatio) => {
            if (intersectionRatio === 0 && !hidden) {
                this.eventsHub.emit('dom:hidden', null);
            }
            hidden = intersectionRatio === 0;
        });

        this.setSizeOptions();
        this.updateContainerSize();

        this.addStyles('ag-charts-community', STYLES);

        this.setContainer(initialContainer);

        this.cleanup.register(stopPageScrolling(this.element));
        this.setupGlobalListeners();

        if (this.mode === 'normal') {
            const guardedElement = this.rootElements['canvas-center'].element;
            if (guardedElement == null) throw new Error('Error initializing tab guards');
            const topGuard = createTabGuardElement(guardedElement, 'beforebegin');
            const botGuard = createTabGuardElement(guardedElement, 'afterend');
            this.tabGuards = new GuardedElement(guardedElement, topGuard, botGuard);
        }
    }

    private initDOM(): HTMLElement {
        if (this.mode === 'normal') {
            // Normal mode with complex DOM, use the external template.
            const templateEl = createElement('div');
            templateEl.innerHTML = NORMAL_DOM;
            return templateEl.firstChild as HTMLElement;
        }

        // Minimal mode - avoid HTML parsing and use a single element. This essentially deactivates
        // many features that rely on the complex DOM (e.g. keyboard navigation, A11y).
        const element = createElement('div');
        element.role = 'presentation';
        element.dataset.agCharts = '';
        element.classList.add('ag-charts-wrapper');
        const seriesArea = createElement('div');
        element.appendChild(seriesArea);
        seriesArea.role = 'presentation';
        seriesArea.classList.add('ag-charts-series-area');
        return element;
    }

    private initRootElements(): Record<DOMElementClass, LiveDOMElement> {
        const { mode, element } = this;

        const rootElements = {} as typeof this.rootElements;
        for (const domElement of DOM_ELEMENT_CLASSES) {
            const className = `ag-charts-${domElement}`;

            let el: HTMLElement;
            if (mode === 'normal') {
                el = element.classList.contains(className)
                    ? element
                    : (element.getElementsByClassName(className)[0] as HTMLElement);
            } else if (MINIMAL_DOM_ELEMENT_ROLES.has(domElement)) {
                el = element;
            } else {
                el = (element.getElementsByClassName(className)[0] as HTMLElement) ?? createElement('div');
            }

            if (el == null) {
                throw new Error(`AG Charts - unable to find DOM element ${className}`);
            }

            rootElements[domElement] = {
                element: el,
                children: new Map<string, StrictHTMLElement>(),
                listeners: [],
            };
        }

        return rootElements;
    }

    override destroy() {
        super.destroy();

        this.observer?.unobserve(this.element);
        if (this.container) {
            this.sizeMonitor.unobserve(this.container);
        }
        this.pendingContainer = undefined;

        for (const el of Object.values(this.rootElements)) {
            for (const c of el.children.values()) {
                c.remove();
            }
            el.element.remove();
        }

        this.element.remove();
    }

    public postRenderUpdate() {
        this.updateStylesLocation();

        if (this.mode === 'minimal') return;
        if (this.pendingContainer == null || this.pendingContainer === this.container) return;

        if (DOMManager.batchedUpdateContainer.length === 0) {
            setTimeout(this.applyBatchedUpdateContainer.bind(this), 0);
        }
        DOMManager.batchedUpdateContainer.push(this);
    }

    private applyBatchedUpdateContainer() {
        for (const manager of DOMManager.batchedUpdateContainer) {
            if (!manager.destroyed) {
                manager.updateContainer();
            }
        }
        DOMManager.batchedUpdateContainer.splice(0);
    }

    private updateStylesLocation() {
        // Check if we transitioned from disconnected to connected
        if (this.initiallyConnected === true || this.container?.isConnected === false) return;

        this.documentRoot = this.getShadowDocumentRoot(this.container);
        this.initiallyConnected = true;
        // Remove styles from our DOM tree before re-adding to correct location
        for (const id of this.rootElements['styles'].children.keys()) {
            this.removeChild('styles', id);
        }
        // Re-add styles to correct location (shadow DOM vs head)
        for (const [id, styles] of this.styles) {
            this.addStyles(id, styles);
        }
    }

    setSizeOptions(minWidth: number = 300, minHeight: number = 300, optionsWidth?: number, optionsHeight?: number) {
        const { style } = this.element;

        style.width = `${optionsWidth ?? minWidth}px`;
        style.height = `${optionsHeight ?? minHeight}px`;

        this.minWidth = optionsWidth ?? minWidth;
        this.minHeight = optionsHeight ?? minHeight;

        this.updateContainerClassName();
    }

    private updateContainerSize() {
        const { style: centerStyle } = this.rootElements['canvas-center'].element;

        centerStyle.visibility = this.containerSize == null ? 'hidden' : '';
        if (this.containerSize) {
            centerStyle.width = `${this.containerSize.width ?? 0}px`;
            centerStyle.height = `${this.containerSize.height ?? 0}px`;
        } else {
            centerStyle.width = '';
            centerStyle.height = '';
        }

        this.updateContainerClassName();
    }

    setTabGuardIndex(tabIndex: number) {
        if (!this.tabGuards) return;

        this.tabGuards.tabIndex = tabIndex;
    }

    setContainer(newContainer?: HTMLElement) {
        if (newContainer === this.container) return;

        this.pendingContainer = newContainer;

        if (this.mode === 'minimal' || this.container == null) {
            // If not currently attached to the DOM, eagerly attach.
            // If in minimal mode, also eagerly attach to allow synchronization with Grid DOM updates.
            this.updateContainer();
        }
    }

    updateContainer() {
        const { pendingContainer } = this;
        if (pendingContainer == null || pendingContainer === this.container) return;

        if (this.container) {
            this.element.remove();
            this.sizeMonitor.unobserve(this.container);
        }

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
        if (this.documentRoot != null) {
            for (const id of this.rootElements['styles'].children.keys()) {
                this.removeChild('styles', id);
            }
        }

        this.container = pendingContainer;
        this.pendingContainer = undefined;
        this.agDocument.setContainer(pendingContainer);
        this.documentRoot = this.getShadowDocumentRoot(pendingContainer);
        this.initiallyConnected = pendingContainer.isConnected;

        // If we moved from a shadow DOM to outside, we need to ensure the page styles are present
        // Or if the container is added lazily, we need to ensure styles are added before the container
        // This is a no-op if styles already exist
        for (const [id, styles] of this.styles) {
            this.addStyles(id, styles);
        }

        pendingContainer.appendChild(this.element);
        this.sizeMonitor.observe(pendingContainer, (size) => {
            this.containerSize = size;
            this.updateContainerSize();
            this.invalidateRectCaches();
            this.eventsHub.emit('dom:resize', null);
        });

        this.invalidateAllCaches();
        this.eventsHub.emit('dom:container-change', null);
    }

    setThemeClass(themeClassName: string) {
        const themeClassNamePrefix = 'ag-charts-theme-';

        for (const className of Array.from(this.element.classList)) {
            if (className.startsWith(themeClassNamePrefix) && className !== themeClassName) {
                this.element.classList.remove(className);
            }
        }

        this.element.classList.add(themeClassName);
    }

    setThemeParameters(params: AgChartThemeParams) {
        for (const [key, value] of entries(params) as Array<[keyof AgChartThemeParams, string | number]>) {
            let formattedValue = `${value}`;
            if (key.endsWith('Size') || key.endsWith('Radius')) {
                formattedValue = `${value}px`;
            } else if (key.endsWith('Border') && typeof value === 'boolean') {
                formattedValue = value ? 'var(--ag-charts-border)' : 'none';
            }
            this.element.style.setProperty(`--ag-charts-${kebabCase(key)}`, formattedValue);
        }
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
        const element = this.getEventElement(this.element, type);
        return attachListener(element, type, listener, options);
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
        this._cachedCanvasRect ??= this.rootElements['canvas'].element.getBoundingClientRect();
        return this._cachedCanvasRect;
    }

    /**
     * Get the client bounding rect for overlay elements that might float outside the bounds of the
     * main chart area.
     */
    getOverlayClientRect() {
        const { innerWidth, innerHeight } = this.agDocument;
        const windowBBox = new BBox(0, 0, innerWidth, innerHeight);
        const containerBBox = this.getRawOverlayClientRect();
        return windowBBox.intersection(containerBBox)?.toDOMRect() ?? NULL_DOMRECT;
    }

    private findScrollableContainer(): HTMLElement | null {
        if (this._cachedScrollableContainer !== undefined) {
            return this._cachedScrollableContainer;
        }

        let element: HTMLElement | null = this.element;
        const fullScreenElement = (this.element.getRootNode() as any as DocumentOrShadowRoot | undefined)
            ?.fullscreenElement;

        // Try and find a parent which will clip rendering of children - if found we should restrict
        // to that elements bounding box.
        while (element != null) {
            let isContainer: boolean;
            if (fullScreenElement != null && element === fullScreenElement) {
                isContainer = true;
            } else {
                const styleMap = element.computedStyleMap?.();
                const overflowY = styleMap?.get('overflow-y')?.toString();

                isContainer = overflowY === 'auto' || overflowY === 'scroll';
            }

            if (isContainer) {
                this._cachedScrollableContainer = element;
                return element;
            }

            element = element.parentElement;
        }

        this._cachedScrollableContainer = null;
        return null;
    }

    private getRawOverlayClientRect(): BBox {
        if (this._cachedRawOverlayRect != null) {
            return this._cachedRawOverlayRect;
        }

        const scrollableContainer = this.findScrollableContainer();

        if (scrollableContainer != null) {
            this._cachedRawOverlayRect = BBox.fromObject(scrollableContainer.getBoundingClientRect());
            return this._cachedRawOverlayRect;
        }

        // If in a shadow-DOM case, use the shadow-DOMs bounding-box, intersected with the window
        // viewport.
        if (this.documentRoot != null) {
            this._cachedRawOverlayRect = BBox.fromObject(this.documentRoot.getBoundingClientRect());
            return this._cachedRawOverlayRect;
        }

        // No scrollable container — cache window dimensions; invalidated on resize.
        const { innerWidth, innerHeight } = this.agDocument;
        this._cachedRawOverlayRect = new BBox(0, 0, innerWidth, innerHeight);
        return this._cachedRawOverlayRect;
    }

    private getShadowDocumentRoot(current = this.container) {
        const docRoot = current?.ownerDocument?.body ?? this.agDocument.body;

        // For shadow-DOM cases, the root node of the shadow-DOM has no parent - we need
        // to attach listeners etc.. to that node, not the document body.
        while (current != null) {
            if (current === docRoot) {
                return undefined;
            }
            if (isDocumentFragment(current.parentNode)) {
                // parentNode is a Shadow DOM.
                return current;
            }

            current = current.parentNode as HTMLElement;
        }
    }

    getParent(domElementClass: DOMElementClass): HTMLElement {
        return this.rootElements[domElementClass].element;
    }

    getChildBoundingClientRect(type: DOMElementClass) {
        const { children } = this.rootElements[type];

        const childRects: BBox[] = [];
        for (const child of children.values()) {
            childRects.push(BBox.fromObject(child.getBoundingClientRect()));
        }

        return BBox.merge(childRects);
    }

    isManagedChildDOMElement(el: HTMLElement, domElementClass: DOMElementClass, id: string) {
        const { children } = this.rootElements[domElementClass];

        const search = children?.get(id);
        return search != null && el.contains(search);
    }

    contains(element: HTMLElement, domElementClass?: DOMElementClass) {
        if (domElementClass == null) return this.element.contains(element);
        return this.rootElements[domElementClass].element.contains(element);
    }

    addStyles(id: string, styles: string) {
        const dataAttribute = 'data-ag-charts';

        this.styles.set(id, styles);

        if (this.container == null) return;

        // Skip CSS injection in SSR - CSS is not needed for canvas-based image rendering
        // and jsdom cannot parse modern CSS features like :has(), causing console errors.
        if (this.skipCss) return;

        const checkId = (el: Element) => {
            return el.getAttribute(dataAttribute) === id;
        };

        const addStyleElement = (el: HTMLElement) => {
            const metaElements = new Set(['TITLE', 'META']);
            let skippingMetaElements = true;
            let insertAfterEl: HTMLElement | undefined;
            for (const child of el.children as any as Iterable<HTMLElement>) {
                if (skippingMetaElements && metaElements.has(child.tagName)) {
                    insertAfterEl = child;
                    continue;
                }

                skippingMetaElements = false;

                if (checkId(child)) return;

                if (child.hasAttribute(dataAttribute)) {
                    insertAfterEl = child;
                }
            }

            const styleEl = createElement('style');
            if (this.chart.styleNonce != null) {
                styleEl.nonce = this.chart.styleNonce;
            }
            if (insertAfterEl == null) {
                el.prepend(styleEl);
            } else {
                el.insertBefore(styleEl, insertAfterEl.nextSibling);
            }
            return styleEl;
        };

        let styleElement: HTMLElement | undefined;
        if (this.styleContainer) {
            // AG-13233 - User supplied root element, don't use heuristics.
            styleElement = addStyleElement(this.styleContainer);
        } else if (this.initiallyConnected === false) {
            // Add to our DOM tree as we don't know if this is a shadow DOM case or not, or even necessarily
            // which Document we might be attached to.
            styleElement = this.addChild('styles', id);
        } else if (this.documentRoot == null && !DOMManager.headStyles.has(id)) {
            // Add to document head as failsafe fallback.
            styleElement = addStyleElement(this.agDocument.head);
            DOMManager.headStyles.add(id);
        } else if (this.documentRoot != null) {
            // Add to our DOM tree to avoid contaminating outside of the shadow DOM.
            styleElement = this.addChild('styles', id);
        }

        // Avoid setting innerHTML on elements we've already configured to avoid style recalculations
        if (styleElement == null || checkId(styleElement)) return;

        styleElement.setAttribute(dataAttribute, id);
        styleElement.innerHTML = styles;
    }

    removeStyles(id: string) {
        this.removeChild('styles', id);
    }

    updateCursor(callerId: string, style?: string) {
        this.cursorState.set(callerId, style);
        this.element.style.cursor = this.cursorState.stateValue()!;
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

        // Only allow return values from createElementId() to be used for newChild.id
        const newChild = (child ?? (createElement(childElementType) satisfies HTMLElement)) as StrictHTMLElement;
        for (const [type, fn, opts] of listeners) {
            newChild.addEventListener(type, fn as any, opts);
        }
        children.set(id, newChild);
        if (childElementType === 'style' && this.chart.styleNonce != null) {
            newChild.nonce = this.chart.styleNonce;
        }
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

    setDataNumber(name: string, value: number) {
        this.element.dataset[name] = String(value);
    }

    getDocument() {
        return this.agDocument;
    }

    private invalidateRectCaches() {
        this._cachedCanvasRect = undefined;
        this._cachedRawOverlayRect = undefined;
    }

    private invalidateAllCaches() {
        this.invalidateRectCaches();
        this._cachedScrollableContainer = undefined;
    }

    private setupGlobalListeners() {
        const win = this.element.ownerDocument.defaultView;
        if (win == null) return;

        const invalidateRects = () => this.invalidateRectCaches();
        const invalidateAll = () => this.invalidateAllCaches();

        win.addEventListener('scroll', invalidateRects, { capture: true, passive: true });
        win.addEventListener('resize', invalidateRects, { passive: true });
        this.element.ownerDocument.addEventListener('fullscreenchange', invalidateAll);

        this.cleanup.register(() => {
            win.removeEventListener('scroll', invalidateRects, { capture: true });
            win.removeEventListener('resize', invalidateRects);
            this.element.ownerDocument.removeEventListener('fullscreenchange', invalidateAll);
        });
    }

    private updateContainerClassName() {
        const { element, containerSize, minWidth, minHeight } = this;
        element.classList.toggle(CONTAINER_MODIFIERS.safeHorizontal, minWidth >= (containerSize?.width ?? Infinity));
        element.classList.toggle(CONTAINER_MODIFIERS.safeVertical, minHeight >= (containerSize?.height ?? Infinity));
    }
}
