import { expect } from 'vitest';

// Core cannot import the community input helpers, so these take real events from real elements.

/** A `<button>` in the document that can open a popup; `focusable` gives it a `tabindex`. */
export function createOpener(focusable: boolean): HTMLButtonElement {
    const opener = document.createElement('button');
    if (focusable) opener.tabIndex = 0;
    document.body.append(opener);
    return opener;
}

/** Clicks `opener` and returns the click event, as a popup would receive it as its `sourceEvent`. */
export function clickEventFrom(opener: HTMLElement): Event {
    let event: Event | undefined;
    opener.addEventListener('click', (e) => (event = e), { once: true });
    opener.click();
    expect(event).toBeDefined();
    return event!;
}
