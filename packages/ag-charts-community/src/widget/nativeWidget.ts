import { createElement } from '../util/dom';
import { Widget } from './widget';

export class NativeWidget<
    TElem extends HTMLElement = HTMLElement,
    Value extends { remove(): void } | undefined = undefined,
> extends Widget<TElem> {
    public readonly value: Value;

    constructor(elem: TElem, value: Value) {
        super(elem);
        this.value = value;
    }

    protected destructor() {
        this.value?.remove();
    }

    public static createElement<K extends keyof HTMLElementTagNameMap>(tag: K): NativeWidget<HTMLElementTagNameMap[K]> {
        return new NativeWidget(createElement(tag), undefined);
    }
}
