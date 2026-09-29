import { h, svg } from '../dom';

const NOTICE_ID = 'fin-demo-notice';

const NOTICE =
    'This is a sample application showcasing AG Charts and AG Grid features. All data shown is synthetic ' +
    'and randomly generated for demonstration purposes only.';

function infoIcon() {
    return svg(
        'svg',
        { width: '16', height: '16', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        svg('circle', { cx: '8', cy: '8', r: '7', stroke: 'currentColor', 'stroke-width': '1.5' }),
        svg('path', { d: 'M8 7v4', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }),
        svg('circle', { cx: '8', cy: '4.75', r: '0.9', fill: 'currentColor' })
    );
}

// The `open` state of the React component: the tooltip exists only while hovered or focused.
export function createDemoInfo(): HTMLSpanElement {
    let tooltip: HTMLSpanElement | undefined;

    const setOpen = (open: boolean) => {
        if (open && !tooltip) {
            tooltip = h('span', { id: NOTICE_ID, role: 'tooltip', class: 'fin-info-tooltip' }, NOTICE);
            root.append(tooltip);
            trigger.setAttribute('aria-describedby', NOTICE_ID);
        } else if (!open && tooltip) {
            tooltip.remove();
            tooltip = undefined;
            trigger.removeAttribute('aria-describedby');
        }
    };

    const trigger = h(
        'button',
        {
            type: 'button',
            class: 'fin-info-trigger',
            'aria-label': 'About this demo',
            onmouseenter: () => setOpen(true),
            onmouseleave: () => setOpen(false),
            onfocus: () => setOpen(true),
            onblur: () => setOpen(false),
            onkeydown: (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false),
        },
        infoIcon()
    );
    const root = h('span', { class: 'fin-info' }, trigger);
    return root;
}
