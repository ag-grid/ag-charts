import { h, svg } from '../dom';

const NOTICE_ID = 'pc-demo-notice';
const GAP = 6;
const EDGE = 12;
/** Below this much room to the right, the tip opens to the left of the icon instead. */
const MIN_TIP_WIDTH = 200;

function infoIcon(): SVGSVGElement {
    return svg(
        'svg',
        { width: '16', height: '16', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        svg('circle', { cx: '8', cy: '8', r: '7', stroke: 'currentColor', 'stroke-width': '1.5' }),
        svg('path', { d: 'M8 7v4', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }),
        svg('circle', { cx: '8', cy: '4.75', r: '0.9', fill: 'currentColor' })
    );
}

/**
 * Fixed, not absolute: the scrolling side bar would clip it. Hover-only, so it never follows a scroll.
 * Returned as the CSS text React writes for the same style object, numbers in pixels.
 */
function tipPosition(trigger: HTMLElement): string {
    const rect = trigger.getBoundingClientRect();
    const vertical =
        rect.top > window.innerHeight / 2 ? `bottom: ${window.innerHeight - rect.bottom}px;` : `top: ${rect.top}px;`;
    const roomRight = window.innerWidth - rect.right - GAP - EDGE;
    const horizontal =
        roomRight >= MIN_TIP_WIDTH
            ? `left: ${rect.right + GAP}px; max-width: min(320px, ${roomRight}px);`
            : `right: ${window.innerWidth - rect.left + GAP}px; max-width: min(320px, ${rect.left - GAP - EDGE}px);`;
    return `${vertical} ${horizontal}`;
}

export function demoNotice(): HTMLSpanElement {
    let tip: HTMLSpanElement | undefined;

    const show = () => {
        const style = tipPosition(trigger);
        if (tip == null) {
            tip = h(
                'span',
                { id: NOTICE_ID, role: 'tooltip', class: 'pc-notice-tip' },
                'This is a sample application showcasing AG Charts and AG Grid features. All data shown is fictional and for demonstration purposes only.'
            );
            el.append(tip);
        }
        tip.style.cssText = style;
        trigger.setAttribute('aria-describedby', NOTICE_ID);
    };
    const hide = () => {
        tip?.remove();
        tip = undefined;
        trigger.removeAttribute('aria-describedby');
    };

    const trigger = h(
        'button',
        {
            type: 'button',
            class: 'pc-notice-trigger',
            'aria-label': 'About this demo',
            onmouseenter: show,
            onmouseleave: hide,
            onfocus: show,
            onblur: hide,
            onkeydown: (event: KeyboardEvent) => event.key === 'Escape' && hide(),
        },
        infoIcon()
    );
    const el = h('span', { class: 'pc-notice' }, trigger);
    return el;
}
