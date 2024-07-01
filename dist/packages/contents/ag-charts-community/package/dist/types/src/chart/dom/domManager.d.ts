import { BBox } from '../../scene/bbox';
import { GuardedElement } from '../../util/guardedElement';
import { type Size } from '../../util/sizeMonitor';
import { BaseManager } from '../baseManager';
declare const DOM_ELEMENT_CLASSES: readonly ["styles", "canvas-center", "canvas", "canvas-proxy", "canvas-overlay"];
export type DOMElementClass = (typeof DOM_ELEMENT_CLASSES)[number];
type Events = {
    type: 'hidden';
} | {
    type: 'resize';
} | {
    type: 'container-changed';
};
export declare class DOMManager extends BaseManager<Events['type'], Events> {
    private readonly rootElements;
    private readonly element;
    private container?;
    containerSize?: Size;
    guardedElement?: GuardedElement;
    private readonly observer?;
    private readonly sizeMonitor;
    constructor(container?: HTMLElement);
    destroy(): void;
    setSizeOptions(minWidth?: number, minHeight?: number, optionsWidth?: number, optionsHeight?: number): void;
    private updateContainerSize;
    setContainer(newContainer: HTMLElement): void;
    setThemeClass(themeClassName: string): void;
    private createTabGuards;
    setTabIndex(tabIndex: number): void;
    getBrowserFocusDelta(): -1 | 0 | 1;
    addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    getBoundingClientRect(): DOMRect;
    getDocumentRoot(): HTMLElement | undefined;
    getChildBoundingClientRect(type: DOMElementClass): BBox;
    calculateCanvasPosition(el: HTMLElement): {
        x: number;
        y: number;
    };
    isManagedDOMElement(el: HTMLElement, container?: HTMLElement): boolean;
    isManagedChildDOMElement(el: HTMLElement, domElementClass: DOMElementClass, id: string): boolean;
    isEventOverElement(event: Event | MouseEvent | TouchEvent): boolean;
    addStyles(id: string, styles: string): void;
    removeStyles(id: string): void;
    updateCursor(style: string): void;
    getCursor(): string;
    addChild(domElementClass: DOMElementClass, id: string, child?: HTMLElement): HTMLElement;
    removeChild(domElementClass: DOMElementClass, id: string): void;
    incrementDataCounter(name: string): void;
}
export {};
