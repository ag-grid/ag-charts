import { isNode } from '../dom/globalsProxy';
import type { MenuWidget } from './menuWidget';
import { Widget } from './widget';

/**
 * The container that holds an open context menu. It wraps an element that the caller created and attached, such as
 * the one `DOMManager.addChild()` returns, and is positioned in CSS pixels within that element's offset parent.
 */
export class ContextMenuContainerWidget extends Widget<HTMLElement, MenuWidget> {
    private readonly observers: MutationObserver[] = [];

    protected override destructor() {
        for (const observer of this.observers) {
            observer.disconnect();
        }
        this.observers.length = 0;
    }

    /** Hides the container with `display: none`, or shows it with `display: block`. */
    override setHidden(hidden: boolean): void {
        this.elem.style.display = hidden ? 'none' : 'block';
    }

    /**
     * Calls `listener` when focus leaves the container: when the element losing focus is inside it and focus moves to
     * nothing or to an element outside it.
     * @returns A function that removes the listener.
     */
    addFocusLeaveListener(listener: () => void): () => void {
        const handler = ({ relatedTarget }: FocusEvent) => {
            if (relatedTarget == null || (isNode(relatedTarget) && !this.elem.contains(relatedTarget))) {
                listener();
            }
        };
        this.elem.addEventListener('focusout', handler);
        return () => this.elem.removeEventListener('focusout', handler);
    }

    /**
     * Calls `listener` whenever the container's child list changes. Asynchronous (`MutationObserver`); never called
     * where `MutationObserver` is unavailable.
     * @returns A function that stops the observation.
     */
    observeChildList(listener: () => void): () => void {
        if (typeof MutationObserver === 'undefined') return () => {};
        const observer = new MutationObserver(() => listener());
        observer.observe(this.elem, { childList: true });
        this.observers.push(observer);
        return () => {
            observer.disconnect();
            const index = this.observers.indexOf(observer);
            if (index !== -1) this.observers.splice(index, 1);
        };
    }

    /** Sets `top` and `bottom` to `unset`, so that the container can be measured without its previous position. */
    unsetVerticalPosition(): void {
        this.elem.style.top = 'unset';
        this.elem.style.bottom = 'unset';
    }

    /** Places the container's left edge at `x` and its top edge 0.5em above `y`, both in CSS pixels. */
    setPosition(x: number, y: number): void {
        this.elem.style.left = `${x}px`;
        this.elem.style.top = `calc(${y}px - 0.5em)`;
    }
}
