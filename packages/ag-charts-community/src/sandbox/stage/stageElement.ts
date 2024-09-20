import { createElement } from '../../util/dom';
import { StageNode } from './stageNode';

export class StageElement<K extends keyof HTMLElementTagNameMap> extends StageNode {
    readonly element: HTMLElement;

    constructor(tagName: K, style?: Partial<CSSStyleDeclaration>);
    constructor(tagName: K, className?: string, style?: Partial<CSSStyleDeclaration>);
    constructor(tagName: K, className?: string, style?: Partial<CSSStyleDeclaration>) {
        super();

        this.element = createElement(tagName, className, style);
    }

    get classList() {
        return this.element.classList;
    }

    setStyle(style: Partial<CSSStyleDeclaration>) {
        Object.assign(this.element.style, style);
    }

    override getBoundingBox(): DOMRect {
        return this.element.getBoundingClientRect();
    }
}
