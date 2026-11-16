import { setAttribute } from '../dom/attributeUtil';
import { isHTMLElement } from '../dom/globalsProxy';

/**
 * The focusable element whose event opened a popup widget, which takes focus back when the popup closes. Kept inside
 * `widget/` so that callers outside it never handle the raw element.
 */
export class Opener {
    /** The opener of a popup shown for `sourceEvent`: its target, if that is an element with a `tabindex`. */
    static fromEvent(sourceEvent: Event | undefined): Opener | undefined {
        const target = sourceEvent?.target;
        if (isHTMLElement(target) && 'tabindex' in target.attributes) {
            return new Opener(target);
        }
        return undefined;
    }

    private constructor(private readonly elem: HTMLElement) {}

    /** Reflects whether the popup this element opened is showing. */
    setAriaExpanded(expanded: boolean) {
        setAttribute(this.elem, 'aria-expanded', expanded);
    }

    /** Moves focus back to the opener. */
    focus(opts?: FocusOptions) {
        this.elem.focus(opts);
    }
}
