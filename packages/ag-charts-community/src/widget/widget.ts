import { type BaseAttributeTypeMap, type BaseStyleTypeMap, setAttribute, setElementStyle } from '../util/attributeUtil';
import type { BBoxValues } from '../util/bboxinterface';
import { getElementBBox, getWindow, setElementBBox } from '../util/dom';
import type { WidgetEventMap } from './widgetEvents';
import { WidgetListenerMap } from './widgetListenerMap';

interface IWidget<TElement extends HTMLElement> {
    index: number;
    destroy(): void;
    getElement(): TElement;
}

export abstract class Widget<
    TElement extends HTMLElement = HTMLElement,
    TChildWidget extends IWidget<HTMLElement> = IWidget<HTMLElement>,
> implements IWidget<TElement>
{
    public index: number = NaN;

    protected readonly children: TChildWidget[] = [];

    constructor(protected readonly elem: TElement) {}

    protected abstract destructor(): void;

    getElement(): TElement {
        return this.elem;
    }

    destroy(): void {
        this.children.forEach((child) => child.destroy());
        this.destructor();
        this.elem.remove();
        this.map?.destroy(this);
    }

    setHidden(hidden: boolean): void {
        setElementStyle(this.elem, 'display', hidden ? 'none' : undefined);
    }

    isHidden(): boolean {
        return getWindow()?.getComputedStyle?.(this.elem).display === 'none';
    }

    setBounds(bounds: BBoxValues): void {
        setElementBBox(this.elem, bounds);
    }

    getBounds(): BBoxValues {
        return getElementBBox(this.elem);
    }

    setCursor(cursor: BaseStyleTypeMap['cursor'] | undefined) {
        setElementStyle(this.elem, 'cursor', cursor);
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
        this.elem.appendChild(child.getElement());
        this.children.push(child);
        child.index = this.children.length - 1;
        this.onChildAdded(child);
    }
    protected onChildAdded(_child: TChildWidget): void {}
    protected onChildRemoved(_child: TChildWidget): void {}

    protected map?: WidgetListenerMap<typeof this>;

    addListener<K extends keyof WidgetEventMap>(
        type: K,
        listener: (target: typeof this, ev: WidgetEventMap[K]) => unknown
    ) {
        this.map ??= new WidgetListenerMap();
        this.map.add(type, this, listener);
    }

    removeListener<K extends keyof WidgetEventMap>(
        type: K,
        listener: (target: typeof this, ev: WidgetEventMap[K]) => unknown
    ) {
        this.map?.remove(type, this, listener);
    }
}
