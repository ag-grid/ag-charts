import { h, svg } from '../dom';
import { FOCUSABLE } from './focusable';

function closeIcon(): SVGSVGElement {
    return svg(
        'svg',
        { width: '12', height: '12', viewBox: '0 0 12 12', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        svg('path', {
            d: 'M3 3l6 6M9 3l-6 6',
            stroke: 'currentColor',
            'stroke-width': '1.5',
            'stroke-linecap': 'round',
        })
    );
}

/** The first focusable element after `element` in document order, outside it. */
function nextFocusable(element: HTMLElement): HTMLElement | undefined {
    return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).find(
        (candidate) =>
            !element.contains(candidate) &&
            (element.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    );
}

/**
 * Where to get help with the workspace. Placeholder copy: the demo has no real support channel, so
 * nothing here is a link. Dismissal lasts for the session only, so a reload brings it back.
 */
export function helpCard(): HTMLElement {
    // The close button goes with the card, so focus moves on rather than dropping to the body.
    const dismiss = () => {
        nextFocusable(section)?.focus();
        section.remove();
    };

    // Not a heading: the card sits before the page's h1 in the DOM.
    const section = h(
        'section',
        { class: 'pc-help', 'aria-labelledby': 'pc-help-title' },
        h(
            'div',
            { class: 'pc-help-head' },
            h('p', { id: 'pc-help-title', class: 'pc-help-title' }, 'Need a hand?'),
            h(
                'button',
                { type: 'button', class: 'pc-help-close', 'aria-label': 'Dismiss help', onclick: dismiss },
                closeIcon()
            )
        ),
        h(
            'p',
            { class: 'pc-help-body' },
            'See the Supply Desk guide on the intranet, or contact Procurement Systems at help@example.com.'
        )
    );
    return section;
}
