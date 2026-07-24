import {
    AgDocument,
    type StrictHTMLElement,
    attachListener,
    createElement,
    createId,
    entries,
    isDirectionRtl,
    isDocumentFragment,
    isObject,
    kebabCase,
    setAttribute,
    stopPageScrolling,
    strictObjectKeys,
} from 'ag-charts-core';
import type { AgChartAllThemeParams } from 'ag-charts-types';

import type { EventsHub } from '../core/eventsHub';
import { BBox } from '../scene/bbox';
import STYLES from '../styles.css';
import { BaseManager } from '../util/baseManager';
import { GuardedElement } from '../util/guardedElement';
import { type PerWindowEntry, createPerWindowRegistry } from '../util/perWindowRegistry';
import { type Size, SizeMonitor } from '../util/sizeMonitor';
import { StateTracker } from '../util/stateTracker';
import { DOMElementProxy, type DeferredMode } from './domElementProxy';
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
    'style-sensors',
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

// Singleton global-listener registry for minimal-mode charts — one DOM listener set per
// Window, fanned out to all subscribers. Torn down when the last subscriber unregisters.

interface GlobalListenerSubscriber {
    invalidateRects: () => void;
    invalidateAll: () => void;
}

interface GlobalListenerEntry extends PerWindowEntry<GlobalListenerSubscriber> {
    window: Window;
    document: Document;
    onScrollResize: EventListener;
    onFullscreen: EventListener;
}

const globalListenerRegistry = createPerWindowRegistry<GlobalListenerSubscriber, GlobalListenerEntry>(
    (window) => {
        const { document } = window;
        const entry: GlobalListenerEntry = {
            window,
            document,
            subscribers: new Set(),
            // Named functions so the fan-out is identifiable in flame graphs.
            onScrollResize: function invalidateRectsGlobal() {
                for (const s of globalListenerRegistry.snapshot(entry)) s.invalidateRects();
            },
            onFullscreen: function invalidateAllGlobal() {
                for (const s of globalListenerRegistry.snapshot(entry)) s.invalidateAll();
            },
        };
        // capture: true catches scroll on descendants (scroll does not bubble).
        window.addEventListener('scroll', entry.onScrollResize, { capture: true, passive: true });
        window.addEventListener('resize', entry.onScrollResize, { capture: true, passive: true });
        document.addEventListener('fullscreenchange', entry.onFullscreen);
        return entry;
    },
    (entry) => {
        entry.window.removeEventListener('scroll', entry.onScrollResize, { capture: true });
        entry.window.removeEventListener('resize', entry.onScrollResize, { capture: true });
        entry.document.removeEventListener('fullscreenchange', entry.onFullscreen);
    },
    'DOMManager.globalListeners'
);

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
    private shadowDocumentRoot?: HTMLElement = undefined;
    // Mirrors the CSS-variable watcher elements already registered, so the per-datum
    // `updateCSSVariableWatchers` call skips an O(children) DOM scan. Normal-path watchers are
    // children of `this.element` and survive container moves; shadow-path watchers live on the
    // shadow root, so their set is cleared when the container (and thus shadow root) changes.
    private readonly cssVariableWatchers = new Set<string>();
    private readonly shadowCssVariableWatchers = new Set<string>();
    private lastThemeParameters?: AgChartAllThemeParams = undefined;
    private initiallyConnected?: boolean = undefined;
    containerSize?: Size = undefined;
    private readonly tabGuards?: GuardedElement;

    private readonly observer?: IntersectionObserver;
    private attachObserver?: MutationObserver;
    private attachIntersectionObserver?: IntersectionObserver;
    private readonly sizeMonitor: SizeMonitor;
    private readonly cursorState = new StateTracker('default');
    private _lastCursor: string = 'default';
    private _lastCenterSize: { visibility: string; width: string; height: string } | undefined = undefined;

    private readonly deferredProxies = new Map<string, DOMElementProxy>();
    private readonly elementProxy: DOMElementProxy;
    private readonly deferredMode: DeferredMode = { scheduleFlush: this.scheduleFlush.bind(this) };

    private minWidth: number = 0;
    private minHeight: number = 0;
    private enableRtl?: boolean;
    private _isRtl: boolean = false;

    private _cachedCanvasRect: DOMRect | undefined;
    private _cachedCanvasScale: { scaleX: number; scaleY: number } | undefined;
    private _cachedRawOverlayRect: BBox | undefined;
    private _cachedVisibleChartRect: DOMRect | null | undefined;
    private _cachedScrollableContainer: HTMLElement | null | undefined;
    private _pendingFlush?: ReturnType<typeof setTimeout>;
    private _deferring: boolean = false;

    constructor(
        private readonly eventsHub: EventsHub,
        private readonly styleNonce: string | undefined,
        private readonly agDocument: AgDocument,
        initialContainer?: HTMLElement,
        private readonly styleContainer?: HTMLElement,
        private readonly skipCss?: boolean,
        readonly mode: 'normal' | 'minimal' = 'normal',
        readonly cssVariables?: Record<string, string>
    ) {
        super();

        this.sizeMonitor = new SizeMonitor(agDocument, mode);

        this.element = this.initDOM();
        this.element.style.cursor = 'default';
        this.elementProxy = new DOMElementProxy(this.element, { deferredMode: this.deferredMode });
        this.rootElements = this.initRootElements();

        this.rootElements['canvas'].element.style.setProperty('anchor-name', this.anchorName);

        this.sizeMonitor.observe(this.rootElements['canvas'].element, () => this.invalidateRectCaches(), {
            skipInitialRead: this.mode === 'minimal',
        });

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

        this.updateCSSVariableWatchers(cssVariables);

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
        this.disconnectAttachObservers();
        this.sizeMonitor.unobserve(this.rootElements['canvas'].element);
        if (this.container) {
            this.sizeMonitor.unobserve(this.container);
        }
        this.pendingContainer = undefined;

        for (const el of Object.values(this.rootElements)) {
            for (const c of el.children.values()) {
                // A transferred canvas (keepTransferableResources) may already have been re-parented
                // into the replacement chart's DOM; only remove nodes this manager still owns so the
                // deferred teardown doesn't orphan the live canvas.
                if (c.parentNode === el.element) {
                    c.remove();
                }
            }
            el.element.remove();
        }

        this.element.remove();
    }

    private scheduleFlush() {
        if (this._deferring) return;
        if (this._pendingFlush != null) return;
        this._pendingFlush = setTimeout(() => {
            this._pendingFlush = undefined;
            if (this._deferring) return; // Abort if re-entered deferring state; next setDeferring(false) will reschedule
            this.flushDeferredProxies();
        });
    }

    private flushDeferredProxies() {
        if (this._pendingFlush != null) {
            clearTimeout(this._pendingFlush);
            this._pendingFlush = undefined;
        }

        this.elementProxy.flush();
        for (const proxy of this.deferredProxies.values()) {
            proxy.flush();
        }

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

    private disconnectAttachObservers() {
        this.attachObserver?.disconnect();
        this.attachObserver = undefined;
        this.attachIntersectionObserver?.disconnect();
        this.attachIntersectionObserver = undefined;
    }

    private readonly onAttachTransition = () => {
        if (this.container?.isConnected === true) {
            this.updateStylesLocation();
        }
    };

    // The disconnected→connected re-measure runs from updateStylesLocation, which only fires off a
    // deferred flush. A container attached after all updates have settled schedules no further flush,
    // so without this the chart latches its unmeasured pre-attachment size. Run the re-measure once
    // on attachment, independent of flush timing.
    private observeAttachTransition(container: HTMLElement) {
        this.disconnectAttachObservers();
        if (this.mode === 'minimal' || this.initiallyConnected !== false) return;

        // A MutationObserver on the document only sees light-DOM insertions; appending the container
        // directly into a connected shadow root mutates the shadow tree, which the document cannot
        // observe. An IntersectionObserver observes the target element itself, so it fires on
        // connection across shadow boundaries — covering the case the MutationObserver misses.
        this.attachObserver = this.agDocument.createMutationObserver(this.onAttachTransition);
        this.attachObserver?.observe(container.ownerDocument.documentElement, { childList: true, subtree: true });

        this.attachIntersectionObserver = this.agDocument.createIntersectionObserver((observedEntries) => {
            if (observedEntries.some((entry) => entry.isIntersecting)) {
                this.onAttachTransition();
            }
        });
        this.attachIntersectionObserver?.observe(container);
    }

    private updateStylesLocation() {
        // Check if we transitioned from disconnected to connected
        if (this.initiallyConnected === true || this.container?.isConnected === false) return;

        this.disconnectAttachObservers();

        this.shadowDocumentRoot = this.getShadowDocumentRoot(this.container);
        this.initiallyConnected = true;
        // Remove styles from our DOM tree before re-adding to correct location
        for (const id of this.rootElements['styles'].children.keys()) {
            this.removeChild('styles', id);
        }
        // Re-add styles to correct location (shadow DOM vs head)
        for (const [id, styles] of this.styles) {
            this.addStyles(id, styles);
        }

        // A container observed while detached had no laid-out size to read; now that it is
        // attached, re-measure so the chart autosizes to fill it instead of latching the
        // unmeasured pre-attachment state.
        if (this.container != null) {
            this.sizeMonitor.refresh(this.container);
        }
    }

    setSizeOptions(minWidth: number = 300, minHeight: number = 300, optionsWidth?: number, optionsHeight?: number) {
        const { style } = this.element;

        this.minWidth = optionsWidth ?? minWidth;
        this.minHeight = optionsHeight ?? minHeight;

        style.minWidth = `${this.minWidth}px`;
        style.minHeight = `${this.minHeight}px`;

        this.updateContainerClassName();
    }

    private updateContainerSize() {
        const visibility = this.containerSize == null ? 'hidden' : '';
        // Floor to the canvas's integer render size; a fractional size ping-pongs the ResizeObserver by 1px.
        const width = this.containerSize ? `${Math.floor(this.containerSize.width ?? 0)}px` : '';
        const height = this.containerSize ? `${Math.floor(this.containerSize.height ?? 0)}px` : '';

        const last = this._lastCenterSize;
        if (last?.visibility !== visibility || last?.width !== width || last?.height !== height) {
            this._lastCenterSize = { visibility, width, height };
            const { style: centerStyle } = this.rootElements['canvas-center'].element;
            centerStyle.visibility = visibility;
            centerStyle.width = width;
            centerStyle.height = height;
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
        if (this.shadowDocumentRoot != null) {
            for (const id of this.rootElements['styles'].children.keys()) {
                this.removeChild('styles', id);
            }
        }

        this.container = pendingContainer;
        this.pendingContainer = undefined;
        this.agDocument.setContainer(pendingContainer);
        // Shadow-path watchers (sensor/style elements plus a transitionend listener) live on the
        // shadow root, not on `this.element`, so a container move does not carry them along. Drop the
        // mirror only when the resolved shadow root actually changes; clearing it for a move within
        // the same root would re-register duplicate watchers over the ones already present. Normal-
        // path watchers are children of `this.element`, which moves with its subtree, so their mirror
        // stays valid regardless.
        const previousShadowRoot = this.shadowDocumentRoot?.getRootNode();
        this.shadowDocumentRoot = this.getShadowDocumentRoot(pendingContainer);
        if (this.shadowDocumentRoot?.getRootNode() !== previousShadowRoot) {
            this.shadowCssVariableWatchers.clear();
        }
        this.initiallyConnected = pendingContainer.isConnected;
        this.observeAttachTransition(pendingContainer);

        // If we moved from a shadow DOM to outside, we need to ensure the page styles are present
        // Or if the container is added lazily, we need to ensure styles are added before the container
        // This is a no-op if styles already exist
        for (const [id, styles] of this.styles) {
            this.addStyles(id, styles);
        }

        pendingContainer.appendChild(this.element);
        this.sizeMonitor.observe(
            pendingContainer,
            (size) => {
                this.containerSize = size;
                this.updateContainerSize();
                this.invalidateRectCaches();
                this.eventsHub.emit('dom:resize', null);
            },
            { skipInitialRead: this.mode === 'minimal' }
        );

        this.invalidateAllCaches();
        this.updateRtl();
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

    setThemeParameters(params: AgChartAllThemeParams) {
        // Called every layout, but the resolved parameters keep a stable reference across data-only
        // updates (the options fast path carries them forward), so skip the re-flatten when unchanged.
        if (params === this.lastThemeParameters) return;
        this.lastThemeParameters = params;

        const variables: Record<string, string | number> = {};

        // Flatten theme params into a single object ready for the css variables
        for (const [key, value] of entries(params as Record<string, any>)) {
            if (!isObject(value)) {
                variables[key] = value;
                continue;
            }
            for (const [subKey, subValue] of entries(value as Record<string, any>)) {
                variables[`${key}${subKey[0].toUpperCase()}${subKey.slice(1)}`] = subValue;
            }
        }

        this.setCSSVariables('--ag-charts', undefined, undefined, variables);
    }

    setModuleCSSVariables(
        module: string,
        component: string | undefined,
        modifier: string | undefined,
        variables: Record<string, string | number>,
        numericKeys?: string[]
    ) {
        this.setCSSVariables(`--ag-charts-${module}`, component, modifier, variables, numericKeys);
    }

    private setCSSVariables(
        prefix: string,
        component: string | undefined,
        modifier: string | undefined,
        variables: Record<string, string | number>,
        numericKeys?: string[]
    ) {
        for (const [key, value] of entries(variables)) {
            let formattedValue = `${value}`;

            if (
                !Number.isNaN(Number(value)) &&
                (key.endsWith('Size') || key.endsWith('Radius') || key.endsWith('Width') || numericKeys?.includes(key))
            ) {
                formattedValue = `${value}px`;
            } else if (key.endsWith('Border') && typeof value === 'boolean') {
                this.element.style.setProperty(
                    this.formatCSSVariableKey(prefix, component, `${key}Color`, modifier),
                    value ? 'var(--ag-charts-border-color)' : 'none'
                );
                this.element.style.setProperty(
                    this.formatCSSVariableKey(prefix, component, `${key}Width`, modifier),
                    value ? 'var(--ag-charts-border-width)' : '0'
                );
                continue;
            }

            this.element.style.setProperty(this.formatCSSVariableKey(prefix, component, key, modifier), formattedValue);
        }
    }

    private formatCSSVariableKey(
        prefix: string,
        component: string | undefined,
        key: string,
        modifier: string | undefined
    ) {
        return `${prefix}${component ? '__' : ''}${component ?? ''}-${kebabCase(key)}${modifier ? '--' : ''}${modifier ?? ''}`;
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

    /** Ancestor CSS `scale(sx, sy)` applied to the canvas — maps canvas-local offsets to screen pixels. */
    getCanvasScale(): { scaleX: number; scaleY: number } {
        if (this._cachedCanvasScale != null) return this._cachedCanvasScale;
        const rect = this.getBoundingClientRect();
        const canvas = this.rootElements['canvas'].element;
        const layoutWidth = canvas.clientWidth;
        const layoutHeight = canvas.clientHeight;
        const scaleX = layoutWidth > 0 && rect.width > 0 ? rect.width / layoutWidth : 1;
        const scaleY = layoutHeight > 0 && rect.height > 0 ? rect.height / layoutHeight : 1;
        this._cachedCanvasScale = { scaleX, scaleY };
        return this._cachedCanvasScale;
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

    /**
     * The visible region of the chart in viewport coordinates: the canvas rect clipped to a
     * scrollable ancestor's rect, or `null` when the chart has no scrollable ancestor. A
     * popover-promoted overlay may still float out to the viewport (see `getOverlayClientRect`),
     * but its anchor should clamp to this region so it stays visually connected to the chart
     * when the chart is partly scrolled out of a scrollable container.
     */
    getVisibleChartRect(): DOMRect | null {
        if (this._cachedVisibleChartRect !== undefined) {
            return this._cachedVisibleChartRect;
        }

        const scrollableContainer = this.findScrollableContainer();
        if (scrollableContainer == null) {
            this._cachedVisibleChartRect = null;
            return null;
        }

        const canvasBBox = BBox.fromObject(this.getBoundingClientRect());
        const containerBBox = BBox.fromObject(scrollableContainer.getBoundingClientRect());
        this._cachedVisibleChartRect = canvasBBox.intersection(containerBBox)?.toDOMRect() ?? NULL_DOMRECT;
        return this._cachedVisibleChartRect;
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

    /**
     * Whether the active window supports the Popover API. Popover-promoted overlays
     * (e.g. tooltips with `popover="manual"`) render in the browser top layer and so
     * escape any ancestor's `overflow` clipping — meaning they should be positioned
     * against the viewport, not clamped to a scrollable ancestor.
     */
    private popoverSupported(): boolean {
        const HTMLElementCtor: typeof HTMLElement | undefined = (this.agDocument.window as any).HTMLElement;
        return typeof HTMLElementCtor?.prototype?.togglePopover === 'function';
    }

    private getRawOverlayClientRect(): BBox {
        if (this._cachedRawOverlayRect != null) {
            return this._cachedRawOverlayRect;
        }

        // When the Popover API is supported, overlays are promoted to the top layer and
        // escape ancestor `overflow` clipping, so we must not clamp to a scrollable
        // ancestor. Browsers without Popover API support retain the clamp below.
        const scrollableContainer = this.popoverSupported() ? null : this.findScrollableContainer();

        if (scrollableContainer != null) {
            this._cachedRawOverlayRect = BBox.fromObject(scrollableContainer.getBoundingClientRect());
            return this._cachedRawOverlayRect;
        }

        // If in a shadow-DOM case, use the shadow-DOMs bounding-box, intersected with the window
        // viewport.
        if (this.shadowDocumentRoot != null) {
            this._cachedRawOverlayRect = BBox.fromObject(this.shadowDocumentRoot.getBoundingClientRect());
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
            if (this.styleNonce != null) {
                styleEl.nonce = this.styleNonce;
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
        } else if (this.shadowDocumentRoot == null && !DOMManager.headStyles.has(id)) {
            // Add to document head as failsafe fallback.
            styleElement = addStyleElement(this.agDocument.head);
            DOMManager.headStyles.add(id);
        } else if (this.shadowDocumentRoot != null) {
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
        const cursor = this.cursorState.stateValue()!;
        if (cursor !== this._lastCursor) {
            this._lastCursor = cursor;
            this.element.style.cursor = cursor;
        }
    }

    getCursor() {
        return this.element.style.cursor;
    }

    get isRtl(): boolean {
        return this._isRtl;
    }

    setEnableRtl(enableRtl?: boolean) {
        this.enableRtl = enableRtl;
        this.updateRtl();
    }

    private updateRtl() {
        // Skip getComputedStyle for minimal mode (sparklines) to avoid forced style recalculation.
        // If RTL is needed, it should be set explicitly via enableRtl in the chart options.
        const isRtl =
            this.enableRtl ??
            (this.mode === 'minimal' ? false : isDirectionRtl(this.container ?? this.pendingContainer));
        if (isRtl === this._isRtl) return;
        this._isRtl = isRtl;
        this.element.dir = isRtl ? 'rtl' : 'ltr';
        this.eventsHub.emit('rtl:change', null);
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
        if (childElementType === 'style' && this.styleNonce != null) {
            newChild.nonce = this.styleNonce;
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

    addProxyChild(domElementClass: DOMElementClass, id: string): DOMElementProxy {
        const element = this.addChild(domElementClass, id);
        const skipInitialRead = this.mode === 'minimal';
        return new DOMElementProxy(element, { sizeMonitor: this.sizeMonitor, skipInitialRead });
    }

    addDeferredProxyChild(domElementClass: DOMElementClass, id: string): DOMElementProxy {
        const element = this.addChild(domElementClass, id);
        const skipInitialRead = this.mode === 'minimal';
        const proxy = new DOMElementProxy(element, {
            deferredMode: this.deferredMode,
            sizeMonitor: this.sizeMonitor,
            skipInitialRead,
        });
        this.deferredProxies.set(`${domElementClass}:${id}`, proxy);
        return proxy;
    }

    public setDeferring(active: boolean): void {
        if (this.mode === 'minimal') return; // Sparklines: skip deferring to avoid concentrated flush
        this._deferring = active;
        if (!active) {
            this.flushDeferredProxies();
        }
    }

    removeChild(domElementClass: DOMElementClass, id: string) {
        const { children } = this.rootElements[domElementClass];
        if (!children) return;

        children.get(id)?.remove();
        children.delete(id);
        this.deferredProxies.delete(`${domElementClass}:${id}`);
    }

    incrementDataCounter(name: string) {
        const current = this.elementProxy.getData(name) ?? '0';
        this.elementProxy.setData(name, String(Number(current) + 1));
    }

    setDataBoolean(name: string, value: boolean) {
        this.elementProxy.setData(name, String(value));
    }

    setDataNumber(name: string, value: number) {
        this.elementProxy.setData(name, String(value));
    }

    getDocument() {
        return this.agDocument;
    }

    private invalidateRectCaches() {
        this._cachedCanvasRect = undefined;
        this._cachedCanvasScale = undefined;
        this._cachedRawOverlayRect = undefined;
        this._cachedVisibleChartRect = undefined;
    }

    private invalidateAllCaches() {
        this.invalidateRectCaches();
        this._cachedScrollableContainer = undefined;
    }

    private setupGlobalListeners() {
        const document = this.element.ownerDocument;
        const window = document.defaultView;
        if (window == null) return;

        if (this.mode === 'minimal') {
            const unregister = globalListenerRegistry.subscribe(window, {
                invalidateRects: () => this.invalidateRectCaches(),
                invalidateAll: () => this.invalidateAllCaches(),
            });
            this.cleanup.register(unregister);
            return;
        }

        // A container move with no resize fires no invalidation event; re-entry re-measures the rect.
        const invalidateOnPointerEnter = () => this.invalidateRectCaches();
        this.element.addEventListener('pointerenter', invalidateOnPointerEnter);
        this.cleanup.register(() => this.element.removeEventListener('pointerenter', invalidateOnPointerEnter));

        const invalidateRects = () => this.invalidateRectCaches();
        const invalidateAll = () => this.invalidateAllCaches();

        // capture: true — the scroll event doesn't bubble, but capture-phase listeners
        // fire for scroll events on any descendant, including nested scrollable containers.
        window.addEventListener('scroll', invalidateRects, { capture: true, passive: true });
        // resize only fires on window itself; capture: true kept for consistency with scroll.
        window.addEventListener('resize', invalidateRects, { capture: true, passive: true });
        document.addEventListener('fullscreenchange', invalidateAll);

        this.cleanup.register(() => {
            window.removeEventListener('scroll', invalidateRects, { capture: true });
            window.removeEventListener('resize', invalidateRects, { capture: true });
            document.removeEventListener('fullscreenchange', invalidateAll);
        });
    }

    updateCSSVariableWatchers(cssVariables?: Record<string, string>) {
        if (!cssVariables) return;

        if (this.shadowDocumentRoot) {
            this.updateCSSVariableWatchersShadowDOM(cssVariables);
            return;
        }

        for (const key of strictObjectKeys(cssVariables)) {
            const property = key.slice(4, -1);
            if (this.cssVariableWatchers.has(property)) continue;
            this.cssVariableWatchers.add(property);

            const styleElement = createElement('style');
            styleElement.dataset.variableName = property;
            styleElement.textContent = `@property ${property} { syntax: '<color>'; inherits: true; initial-value: transparent; }`;
            this.element.prepend(styleElement);

            const sensorElement = createElement('div');
            sensorElement.style.setProperty('transition', `${property} 1ms`, 'important');
            this.rootElements['style-sensors'].element.appendChild(sensorElement);

            const handleTransitionEnd = () => {
                this.eventsHub.emit('chart:request-refresh', null);
            };
            sensorElement.addEventListener('transitionend', handleTransitionEnd);
            this.cleanup.register(() => {
                sensorElement.removeEventListener('transitionend', handleTransitionEnd);
                sensorElement.remove();
                styleElement.remove();
            });
        }
    }

    private updateCSSVariableWatchersShadowDOM(cssVariables: Record<string, string>) {
        const shadowRoot = this.shadowDocumentRoot?.getRootNode() as HTMLElement | undefined;
        if (!shadowRoot || !('addEventListener' in shadowRoot)) return;

        // Attach a single event listener to the shadow root to catch the bubbled events for every property, rather
        // than a different event for each property.
        if (this.shadowCssVariableWatchers.size === 0) {
            const handleTransitionEnd = () => {
                this.eventsHub.emit('chart:request-refresh', null);
            };
            shadowRoot.addEventListener('transitionend', handleTransitionEnd);
            this.cleanup.register(() => {
                shadowRoot.removeEventListener('transitionend', handleTransitionEnd);
            });
        }

        for (const key of strictObjectKeys(cssVariables)) {
            const property = key.slice(4, -1);
            if (this.shadowCssVariableWatchers.has(property)) continue;
            this.shadowCssVariableWatchers.add(property);

            // Unlike normal DOM, here we transition directly on the color property since we need to combine the style
            // and sensor into a single element.
            const styleElement = createElement('div');
            styleElement.style.color = key;
            styleElement.style.setProperty('transition', 'color 1ms', 'important');
            styleElement.dataset.variableName = property;

            shadowRoot.prepend(styleElement);
        }
    }

    private updateContainerClassName() {
        const { element, containerSize, minWidth, minHeight } = this;
        element.classList.toggle(CONTAINER_MODIFIERS.safeHorizontal, minWidth >= (containerSize?.width ?? Infinity));
        element.classList.toggle(CONTAINER_MODIFIERS.safeVertical, minHeight >= (containerSize?.height ?? Infinity));
    }
}
