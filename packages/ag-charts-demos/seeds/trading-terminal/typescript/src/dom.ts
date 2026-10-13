// The whole "framework" of this port: a pair of element builders that stand in for the React
// demo's JSX, so every component keeps the same element structure, class names and attributes.
//
// - `h(tag, attrs, ...children)` creates an HTML element; `svg()` does the same in the SVG namespace.
// - Attribute keys are written exactly as they appear in the JSX output (`class`, `aria-label`,
//   `data-state`, `for`) and set with `setAttribute`. Two exceptions: `style` takes a CSS text, and
//   an `on<Event>` key whose value is a function adds a listener for `<event>`, lower-cased.
// - `null`, `undefined` and `false` skip an attribute or child, as they do in JSX; `true` sets an
//   attribute to the empty string.
//
// There is no virtual DOM. A component builds its elements once and updates them in place from an
// explicit `update()` that runs where the React component's effects would.

export type Child = Node | string | number | null | undefined | false;

// Handlers are declared with the event type they expect; the listener registration does the cast.
export type Listener = (event: never) => void;

export type Attrs = Record<string, string | number | boolean | Listener | null | undefined>;

/** A component with a root element, mounted once its element is in the document. */
export interface View {
    el: HTMLElement;
    /** Create anything that needs the element to be in the document (charts, grids). */
    mount(): void;
    destroy(): void;
}

function applyAttrs(el: Element, attrs: Attrs | undefined) {
    if (!attrs) return;
    for (const [key, value] of Object.entries(attrs)) {
        if (value == null || value === false) continue;
        if (typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
        } else if (key === 'style') {
            (el as HTMLElement | SVGElement).style.cssText = String(value);
        } else {
            el.setAttribute(key, value === true ? '' : String(value));
        }
    }
}

/** Append children, skipping the falsy ones as JSX does. */
export function append(el: Element, children: Child[]) {
    for (const child of children) {
        if (child == null || child === false) continue;
        el.append(typeof child === 'object' ? child : String(child));
    }
}

export function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: Attrs,
    ...children: Child[]
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    applyAttrs(el, attrs);
    append(el, children);
    return el;
}

export function svg<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attrs?: Attrs,
    ...children: Child[]
): SVGElementTagNameMap[K] {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    applyAttrs(el, attrs);
    append(el, children);
    return el;
}
