import {
    type BaseAttributeTypeMap,
    type BaseStyleTypeMap,
    getAttribute,
    setAttribute,
    setElementStyle,
    setElementStyles,
} from '../util/attributeUtil';
import type { BBoxValues } from '../util/bboxinterface';
import { getElementBBox, getWindow, setElementBBox } from '../util/dom';
import { type WidgetEventMap, WidgetEventUtil } from './widgetEvents';
import { WidgetListenerHTML } from './widgetListenerHTML';
import { WidgetListenerInternal } from './widgetListenerInternal';

type EventMap = WidgetEventMap;
type EventType = keyof WidgetEventMap;

interface IWidget<TElement extends HTMLElement> {
    index: number;
    domIndex?: number;
    parent?: Widget<HTMLElement, IWidget<HTMLElement>>;
    destroy(): void;
    getElement(): TElement;
}

export type BeforeWidget<T extends IWidget<HTMLElement>> = T & { domIndex: number };

abstract class WidgetBounds {
    protected readonly elem: HTMLElement;
    protected elemContainer?: HTMLDivElement;
    constructor(elem: HTMLElement) {
        this.elem = elem;
    }

    setBounds(bounds: Partial<BBoxValues>): void {
        setElementBBox(this.elemContainer ?? this.elem, bounds);
    }

    getBounds(): BBoxValues {
        return getElementBBox(this.elemContainer ?? this.elem);
    }

    protected static setElementContainer(widget: WidgetBounds, elemContainer: HTMLDivElement) {
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
    extends WidgetBounds
    implements IWidget<TElement>
{
    public index: number = NaN;
    // WARNING (not implemented): setting domIndex will not move it in the DOM. This property is currently only used
    // when adding child widgets.
    public domIndex?: number;
    public parent?: Widget<HTMLElement, IWidget<HTMLElement>>;

    protected readonly children: TChildWidget[] = [];
    protected htmlListener?: WidgetListenerHTML;
    protected internalListener?: WidgetListenerInternal;

    constructor(protected override readonly elem: TElement) {
        super(elem);
    }

    protected abstract destructor(): void;

    getElement(): TElement {
        return this.elem;
    }

    get clientWidth(): number {
        return this.elem.clientWidth;
    }

    get clientHeight(): number {
        return this.elem.clientHeight;
    }

    destroy(): void {
        this.parent?.removeChild(this);
        this.children.forEach((child) => {
            child.parent = undefined;
            child.destroy();
        });
        this.children.length = 0;
        this.destructor();
        this.elem.remove();
        this.elemContainer?.remove();
        this.internalListener?.destroy();
        this.htmlListener?.destroy(this);
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

    setInnerHTML(html: string) {
        this.elem.innerHTML = html;
    }

    isDisabled() {
        return getAttribute(this.elem, 'aria-disabled', false);
    }

    private parseFloat(s: string) {
        return s === '' ? 0 : parseFloat(s);
    }
    cssLeft(): number {
        return this.parseFloat(this.elem.style.left);
    }
    cssTop(): number {
        return this.parseFloat(this.elem.style.top);
    }

    focus(): void {
        this.elem.focus();
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
        const i = this.children.findIndex((value) => value === child);
        this.children.splice(i, 1);
        this.removeChildFromDOM(child);
        this.onChildRemoved(child);
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
        this.elem.removeChild(child.getElement());
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

    addListener<K extends EventType>(type: K, listener: (ev: EventMap[K], current: typeof this) => unknown): void;
    addListener<K extends EventType>(type: K, listener: (ev: unknown, current: typeof this) => unknown): void {
        if (WidgetEventUtil.isHTMLEvent(type)) {
            this.htmlListener ??= new WidgetListenerHTML();
            this.htmlListener.add(type, this, listener);
        } else {
            this.internalListener ??= new WidgetListenerInternal();
            this.internalListener.add(type, this, listener);
        }
    }

    removeListener<K extends EventType>(type: K, listener: (ev: EventMap[K], current: typeof this) => unknown): void;
    removeListener<K extends EventType>(type: K, listener: (ev: unknown, current: typeof this) => unknown): void {
        if (WidgetEventUtil.isHTMLEvent(type)) {
            this.htmlListener?.remove(type, this, listener);
        } else if (this.htmlListener != null) {
            this.internalListener?.remove(type, this, listener);
        }
    }
}
