import type { BaseAttributeTypeMap, BaseStyleTypeMap, BoxBounds, ElementID } from 'ag-charts-core';
import {
    attachListener,
    getAttribute,
    getElementBBox,
    getWindow,
    setAttribute,
    setElementBBox,
    setElementStyle,
    setElementStyles,
} from 'ag-charts-core';

import { type WidgetEventMap, type WidgetEventMap_Internal, WidgetEventUtil } from './widgetEvents';
import { WidgetListenerHTML } from './widgetListenerHTML';
import { WidgetListenerInternal } from './widgetListenerInternal';

type EventMap = WidgetEventMap;
type EventType = keyof WidgetEventMap;

interface IWidget<TElement extends HTMLElement> {
    index: number;
    domIndex?: number;
    parent?: Widget;
    destroy(): void;
    getElement(): TElement;
}

export type BeforeWidget<T extends IWidget<HTMLElement>> = T & { domIndex: number };

abstract class WidgetBounds<TElement extends HTMLElement> {
    protected elemContainer?: HTMLDivElement;
    constructor(protected readonly elem: TElement) {}

    setBounds(bounds: Partial<BoxBounds>): void {
        setElementBBox(this.elemContainer ?? this.elem, bounds);
    }

    getBounds(): BoxBounds {
        return getElementBBox(this.elemContainer ?? this.elem);
    }

    protected static setElementContainer(widget: WidgetBounds<HTMLElement>, elemContainer: HTMLDivElement) {
        const currentBounds = widget.getBounds();
        setElementBBox(elemContainer, currentBounds);
        setElementStyles(widget.elem, { width: '100%', height: '100%' });
        widget.elem.remove();
        widget.elemContainer = elemContainer;
        widget.elemContainer.replaceChildren(widget.elem);
    }
}

export abstract class Widget<
        TElement extends HTMLElement = HTMLElement,
        TChildWidget extends IWidget<HTMLElement> = IWidget<HTMLElement>,
    >
    extends WidgetBounds<TElement>
    implements IWidget<TElement>
{
    public index: number = Number.NaN;
    // WARNING (not implemented): setting domIndex will not move it in the DOM. This property is currently only used
    // when adding child widgets.
    public domIndex?: number;
    public parent?: Widget;

    protected readonly children: TChildWidget[] = [];
    protected htmlListener?: WidgetListenerHTML;
    protected internalListener?: WidgetListenerInternal;
    public destroyListener?: () => void; // Temporary fix for RTI-2977

    protected abstract destructor(): void;

    set id(elementId: ElementID | undefined) {
        setAttribute(this.elem, 'id', elementId);
    }

    get id(): ElementID | undefined {
        return getAttribute(this.elem, 'id');
    }

    getElement(): TElement {
        return this.elem;
    }

    getBoundingClientRect(): DOMRect {
        return this.elem.getBoundingClientRect();
    }

    get clientWidth(): number {
        return this.elem.clientWidth;
    }

    get clientHeight(): number {
        return this.elem.clientHeight;
    }

    destroy(): void {
        this.destroyListener?.();
        this.destroyListener = undefined;
        this.remove();
        for (const child of this.children) {
            child.parent = undefined;
            child.destroy();
        }
        this.children.length = 0;
        this.destructor();
        this.remove();
        this.internalListener?.destroy();
        this.htmlListener?.destroy(this);
    }

    remove(): void {
        this.elem.remove();
        this.elemContainer?.remove();
    }

    setHidden(hidden: boolean): void {
        setElementStyle(this.elem, 'display', hidden ? 'none' : undefined);
    }

    isHidden(): boolean {
        return getWindow()?.getComputedStyle?.(this.elem).display === 'none';
    }

    setCursor(cursor: BaseStyleTypeMap['cursor'] | undefined) {
        setElementStyle(this.elem, 'cursor', cursor);
    }

    setTextContent(textContent: string | undefined) {
        this.elem.textContent = textContent ?? null;
    }

    setAriaDescribedBy(ariaDescribedBy: BaseAttributeTypeMap['aria-describedby'] | undefined) {
        setAttribute(this.elem, 'aria-describedby', ariaDescribedBy);
    }

    setAriaHidden(ariaHidden: BaseAttributeTypeMap['aria-hidden'] | undefined) {
        setAttribute(this.elem, 'aria-hidden', ariaHidden);
    }

    setAriaLabel(ariaLabel: BaseAttributeTypeMap['aria-label'] | undefined) {
        setAttribute(this.elem, 'aria-label', ariaLabel);
    }

    setAriaExpanded(ariaExpanded: BaseAttributeTypeMap['aria-expanded'] | undefined) {
        setAttribute(this.elem, 'aria-expanded', ariaExpanded);
    }

    setAriaControls(ariaControls: BaseAttributeTypeMap['aria-controls'] | undefined) {
        setAttribute(this.elem, 'aria-controls', ariaControls);
    }

    setAriaHasPopup(ariaHasPopup: BaseAttributeTypeMap['aria-haspopup'] | undefined) {
        setAttribute(this.elem, 'aria-haspopup', ariaHasPopup);
    }

    setInnerHTML(html: string) {
        this.elem.innerHTML = html;
    }

    setPointerEvents(pointerEvents: BaseStyleTypeMap['pointer-events'] | undefined) {
        setElementStyle(this.elem, 'pointer-events', pointerEvents);
    }

    setCSSVariable(key: `--${string}`, value: string | null) {
        this.elem.style.setProperty(key, value);
    }

    isDisabled() {
        return getAttribute(this.elem, 'aria-disabled', false);
    }

    hasPopup(): boolean {
        const ariaHasPopup = getAttribute(this.elem, 'aria-haspopup');
        return ariaHasPopup !== undefined && ariaHasPopup !== 'false';
    }

    private parseFloat(s: string) {
        return s === '' ? 0 : Number.parseFloat(s);
    }
    cssLeft(): number {
        return this.parseFloat(this.elem.style.left);
    }
    cssTop(): number {
        return this.parseFloat(this.elem.style.top);
    }
    cssWidth(): number {
        return this.parseFloat(this.elem.style.width);
    }
    cssHeight(): number {
        return this.parseFloat(this.elem.style.height);
    }

    focus(opts?: Parameters<HTMLElement['focus']>[0]): void {
        this.elem.focus(opts);
    }

    setFocusOverride(focus: boolean | undefined) {
        setAttribute(this.elem, 'data-focus-override', focus);
    }

    setPreventsDefault(preventDefault: boolean) {
        setAttribute(this.elem, 'data-preventdefault', preventDefault);
    }

    setTabIndex(tabIndex: BaseAttributeTypeMap['tabindex']) {
        setAttribute(this.elem, 'tabindex', tabIndex);
    }

    addChild(child: TChildWidget) {
        this.addChildToDOM(child, this.getBefore(child));
        this.children.push(child);
        child.index = this.children.length - 1;
        child.parent = this;
        this.onChildAdded(child);
    }

    removeChild(child: TChildWidget) {
        const i = this.children.indexOf(child);
        this.children.splice(i, 1);
        this.removeChildFromDOM(child);
        this.onChildRemoved(child);
    }

    moveChild(child: TChildWidget, domIndex: number) {
        if (child.domIndex === domIndex) return;

        child.domIndex = domIndex;
        this.removeChildFromDOM(child);
        this.addChildToDOM(child, this.getBefore(child));
    }

    addClass(...tokens: string[]) {
        this.elem.classList.add(...tokens);
    }

    removeClass(...tokens: string[]) {
        this.elem.classList.remove(...tokens);
    }

    toggleClass(token: string, force?: boolean) {
        this.elem.classList.toggle(token, force);
    }

    protected appendOrInsert(child: HTMLElement, before: TChildWidget | undefined) {
        if (before) {
            before.getElement().insertAdjacentElement('beforebegin', child);
        } else {
            this.elem.appendChild(child);
        }
    }

    protected addChildToDOM(child: TChildWidget, before: TChildWidget | undefined) {
        this.appendOrInsert(child.getElement(), before);
    }

    protected removeChildFromDOM(child: TChildWidget): void {
        child.getElement().remove();
    }

    protected onChildAdded(_child: TChildWidget): void {}
    protected onChildRemoved(_child: TChildWidget): void {}

    private getBefore({ domIndex }: TChildWidget) {
        type R = BeforeWidget<TChildWidget>;

        if (domIndex === undefined) return undefined;
        return this.children
            .filter((child): child is R => child.domIndex !== undefined && child.domIndex > domIndex)
            .reduce<R | undefined>((prev, curr) => (!prev || curr.domIndex < prev.domIndex ? curr : prev), undefined);
    }

    addListener<K extends EventType>(type: K, listener: (ev: EventMap[K], current: typeof this) => unknown): () => void;
    addListener<K extends EventType>(type: K, listener: (ev: unknown, current: typeof this) => unknown): () => void {
        if (WidgetEventUtil.isHTMLEvent(type)) {
            this.htmlListener ??= new WidgetListenerHTML();
            this.htmlListener.add(type, this, listener);
        } else {
            this.internalListener ??= new WidgetListenerInternal(this.onDispatch.bind(this));
            this.internalListener.add(type, this, listener);
        }
        return () => this.removeListener(type, listener);
    }

    removeListener<K extends EventType>(type: K, listener: (ev: EventMap[K], current: typeof this) => unknown): void;
    removeListener<K extends EventType>(type: K, listener: (ev: unknown, current: typeof this) => unknown): void {
        if (WidgetEventUtil.isHTMLEvent(type)) {
            this.htmlListener?.remove(type, this, listener);
        } else if (this.htmlListener != null) {
            this.internalListener?.remove(type, this, listener);
        }
    }

    setDragTouchEnabled(dragTouchEnabled: boolean) {
        this.internalListener ??= new WidgetListenerInternal(this.onDispatch.bind(this));
        this.internalListener.dragTouchEnabled = dragTouchEnabled;
    }

    private onDispatch<K extends keyof WidgetEventMap_Internal>(type: K, event: WidgetEventMap_Internal[K]) {
        // Handle event bubbling for drag events.
        if (!event.sourceEvent?.bubbles) return;
        let { parent } = this;
        while (parent != null) {
            const { internalListener } = parent;
            if (internalListener != null) {
                const parentEvent = { ...event, ...WidgetEventUtil.calcCurrentXY(parent.getElement(), event) };
                internalListener.dispatch(type, parent, parentEvent);
            }
            parent = parent.parent;
        }
    }

    static addWindowEvent(_type: 'page-left', listener: () => unknown): () => void {
        const pagehideHandler = (event: PageTransitionEvent) => {
            if (event.persisted) {
                return; // Don't fire the page-left event since the page maybe revisited.
            }
            listener();
        };
        return attachListener(getWindow(), 'pagehide', pagehideHandler);
    }
}
