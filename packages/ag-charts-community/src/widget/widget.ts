import {
    type BaseAttributeTypeMap,
    type BaseStyleTypeMap,
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
    destroy(): void;
    getElement(): TElement;
}

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

    protected readonly children: TChildWidget[] = [];
    protected htmlListener?: WidgetListenerHTML<typeof this>;
    protected internalListener?: WidgetListenerInternal<typeof this>;

    constructor(protected override readonly elem: TElement) {
        super(elem);
    }

    protected abstract destructor(): void;

    getElement(): TElement {
        return this.elem;
    }

    destroy(): void {
        this.children.forEach((child) => child.destroy());
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

    cssLeft(): number {
        return parseFloat(this.elem.style.left);
    }
    cssTop(): number {
        return parseFloat(this.elem.style.top);
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

    appendChild(child: TChildWidget) {
        this.appendChildToDOM(child);
        this.children.push(child);
        child.index = this.children.length - 1;
        this.onChildAdded(child);
    }

    protected appendChildToDOM(child: TChildWidget) {
        this.elem.appendChild(child.getElement());
    }

    protected removeChildFromDOM(child: TChildWidget): void {
        this.elem.removeChild(child.getElement());
    }

    protected onChildAdded(_child: TChildWidget): void {}
    protected onChildRemoved(_child: TChildWidget): void {}

    addListener<K extends EventType>(type: K, listener: (target: typeof this, ev: EventMap[K]) => unknown): void;
    addListener<K extends EventType>(type: K, listener: (target: typeof this, ev: unknown) => unknown): void {
        if (WidgetEventUtil.isHTMLEvent(type)) {
            this.htmlListener ??= new WidgetListenerHTML();
            this.htmlListener.add(type, this, listener);
        } else {
            this.internalListener ??= new WidgetListenerInternal();
            this.internalListener.add(type, this, listener);
        }
    }

    removeListener<K extends EventType>(type: K, listener: (target: typeof this, ev: EventMap[K]) => unknown): void;
    removeListener<K extends EventType>(type: K, listener: (target: typeof this, ev: unknown) => unknown): void {
        if (WidgetEventUtil.isHTMLEvent(type)) {
            this.htmlListener?.remove(type, this, listener);
        } else if (this.htmlListener != null) {
            this.internalListener?.remove(type, this, listener);
        }
    }
}
