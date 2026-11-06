import type { TextAlign } from 'ag-charts-types';

import type { BaseAttributeTypeMap, BaseStyleTypeMap } from '../dom/attributeUtil';
import { getAttribute, setAttribute, setElementStyle, setElementStyles } from '../dom/attributeUtil';
import { getElementBBox, isFocused, setElementBBox } from '../dom/domUtil';
import { isNode } from '../dom/globalsProxy';
import type { BoxBounds } from '../geometry/boxBounds';
import type { ElementID } from '../identity/idBranding';
import type { Point } from '../types/scene';
import type { CanvasOrigin, WidgetEvent, WidgetEventMap, WidgetEventMap_Internal } from './widgetEvents';
import { WidgetEventUtil } from './widgetEvents';
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
    private canvasOrigin?: CanvasOrigin;
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

    setCanvasOrigin(origin: CanvasOrigin | undefined): void {
        this.canvasOrigin = origin;
    }

    getCanvasOrigin(): CanvasOrigin | undefined {
        let widget: Widget | undefined = this;
        while (widget != null) {
            if (widget.canvasOrigin != null) return widget.canvasOrigin;
            widget = widget.parent;
        }
        return undefined;
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

    get offsetWidth(): number {
        return this.elem.offsetWidth;
    }

    get offsetHeight(): number {
        return this.elem.offsetHeight;
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
        this.internalListener?.destroy();
        this.htmlListener?.destroy(this);
    }

    remove(): void {
        this.elem.remove();
        this.elemContainer?.remove();
        this.parent?.removeChildWidget(this);
    }

    setHidden(hidden: boolean): void {
        setElementStyle(this.elem, 'display', hidden ? 'none' : undefined);
    }

    isHidden(): boolean {
        const { defaultView } = this.elem.ownerDocument;
        return defaultView?.getComputedStyle(this.elem).display === 'none';
    }

    setCursor(cursor: BaseStyleTypeMap['cursor'] | undefined) {
        setElementStyle(this.elem, 'cursor', cursor);
    }

    setTextContent(textContent: string | undefined) {
        this.elem.textContent = textContent ?? null;
    }

    setAriaRole(role: BaseAttributeTypeMap['role'] | undefined) {
        setAttribute(this.elem, 'role', role);
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

    setAriaChecked(ariaChecked: BaseAttributeTypeMap['aria-checked'] | undefined) {
        setAttribute(this.elem, 'aria-checked', ariaChecked);
    }

    setAriaSelected(ariaSelected: BaseAttributeTypeMap['aria-selected'] | undefined) {
        setAttribute(this.elem, 'aria-selected', ariaSelected);
    }

    setAriaLabelledBy(ariaLabelledBy: BaseAttributeTypeMap['aria-labelledby'] | undefined) {
        setAttribute(this.elem, 'aria-labelledby', ariaLabelledBy);
    }

    /** Sets the `title` attribute (the native tooltip), or removes it when `undefined` or empty. */
    setTitle(title: BaseAttributeTypeMap['title'] | undefined) {
        setAttribute(this.elem, 'title', title);
    }

    /**
     * Sets a `data-*` attribute through `dataset`, or removes it when `value` is `undefined`.
     * @param name - The camelCase `dataset` key, e.g. `popoverId` for `data-popover-id`.
     */
    setData(name: string, value: string | undefined) {
        if (value === undefined) {
            delete this.elem.dataset[name];
        } else {
            this.elem.dataset[name] = value;
        }
    }

    /** Positions the element with a CSS `translate()` transform, in CSS pixels, replacing any existing transform. */
    setTranslate(x: number, y: number) {
        this.elem.style.transform = `translate(${x}px, ${y}px)`;
    }

    /**
     * Moves the element through its inline `left`/`top`, in CSS pixels. An omitted coordinate keeps its current value.
     * Inline `right`/`bottom` are set to `unset` so they cannot pull against the new position.
     */
    setCssOffset(position: Partial<Point>) {
        const { style } = this.elem;
        style.setProperty('right', 'unset');
        style.setProperty('bottom', 'unset');
        if (position.x != null) style.setProperty('left', `${position.x}px`);
        if (position.y != null) style.setProperty('top', `${position.y}px`);
    }

    /** Sets the inline `min-width` in CSS pixels, or removes it when `undefined`. */
    setMinWidth(minWidth: number | undefined) {
        if (minWidth == null) {
            this.elem.style.removeProperty('min-width');
        } else {
            this.elem.style.setProperty('min-width', `${minWidth}px`);
        }
    }

    /** Sets the inline `width` in CSS pixels, or removes it when `undefined`. */
    setWidth(width: number | undefined) {
        if (width == null) {
            this.elem.style.removeProperty('width');
        } else {
            this.elem.style.setProperty('width', `${width}px`);
        }
    }

    /** Sets the inline `max-width` in CSS pixels, or removes it when `undefined`. */
    setMaxWidth(maxWidth: number | undefined) {
        if (maxWidth == null) {
            this.elem.style.removeProperty('max-width');
        } else {
            this.elem.style.setProperty('max-width', `${maxWidth}px`);
        }
    }

    /** Sets the inline `text-align`, or removes it when `undefined`. */
    setTextAlign(textAlign: TextAlign | undefined) {
        if (textAlign == null) {
            this.elem.style.removeProperty('text-align');
        } else {
            this.elem.style.setProperty('text-align', textAlign);
        }
    }

    setInnerHTML(html: string) {
        this.elem.innerHTML = html;
    }

    setPointerEvents(pointerEvents: BaseStyleTypeMap['pointer-events'] | undefined) {
        setElementStyle(this.elem, 'pointer-events', pointerEvents);
    }

    setTouchAction(touchAction: BaseStyleTypeMap['touch-action'] | undefined) {
        // Assign via camelCase — jsdom silently drops `style.setProperty('touch-action', …)`.
        if (touchAction == null) {
            this.elem.style.touchAction = '';
        } else {
            this.elem.style.touchAction = touchAction;
        }
    }

    setCSSVariable(key: `--${string}`, value: string | null) {
        this.elem.style.setProperty(key, value);
    }

    isDisabled() {
        return getAttribute(this.elem, 'aria-disabled', false);
    }

    containsTarget(event: Pick<WidgetEvent, 'sourceEvent'>) {
        return isNode(event.sourceEvent.target) && this.elem.contains(event.sourceEvent.target);
    }

    /** Whether the event was dispatched to this widget's own element, excluding its descendants. */
    isEventTarget(event: Pick<WidgetEvent, 'sourceEvent'>): boolean {
        return event.sourceEvent.target === this.elem;
    }

    /** Whether the event is being handled by a listener on this widget's own element. */
    isEventCurrentTarget(event: Pick<WidgetEvent, 'sourceEvent'>): boolean {
        return event.sourceEvent.currentTarget === this.elem;
    }

    /**
     * Whether `other`'s element is this widget's element or one of its DOM descendants. This checks the DOM, not the
     * widget tree.
     */
    contains(other: Pick<Widget, 'getElement'>): boolean {
        return this.elem.contains(other.getElement());
    }

    /** Whether this widget's element is the active element of its document or shadow root. */
    isFocused(): boolean {
        return isFocused(this.elem);
    }

    /** Whether the pointer is over this widget's element (the CSS `:hover` state). */
    isHovered(): boolean {
        return this.elem.matches(':hover');
    }

    /** Whether this widget's element has keyboard-visible focus (the CSS `:focus-visible` state). */
    isFocusVisible(): boolean {
        return this.elem.matches(':focus-visible');
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

    setTabIndex(tabIndex: BaseAttributeTypeMap['tabindex'] | undefined) {
        setAttribute(this.elem, 'tabindex', tabIndex);
    }

    addChild(child: TChildWidget) {
        this.addChildToDOM(child, this.getBefore(child));
        this.children.push(child);
        child.index = this.children.length - 1;
        child.parent = this;
        this.onChildAdded(child);
    }

    removeChildWidget(child: TChildWidget) {
        const i = this.children.indexOf(child);
        // `remove()` reaches here again for a child that was already removed, since `parent` is left set.
        if (i < 0) return;
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

    /**
     * Moves `sibling`'s element into the DOM immediately after this widget's element. Only the DOM changes: the widget
     * tree is not updated, so `sibling` keeps its current `parent` (if any).
     */
    insertSiblingAfter(sibling: Pick<Widget, 'getElement'>): void {
        this.elem.insertAdjacentElement('afterend', sibling.getElement());
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
                const parentEvent = { ...event, ...WidgetEventUtil.calcCurrentXY(parent, event) };
                internalListener.dispatch(type, parent, parentEvent);
            }
            parent = parent.parent;
        }
    }
}
