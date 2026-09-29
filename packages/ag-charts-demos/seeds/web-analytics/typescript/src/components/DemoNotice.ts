import { type View, h, staticView, svg } from '../dom';

const NOTICE_ID = 'wa-demo-notice';

function infoIcon() {
    return svg(
        'svg',
        { width: '18', height: '18', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        svg('circle', { cx: '8', cy: '8', r: '7', stroke: 'currentColor', 'stroke-width': '1.5' }),
        svg('path', { d: 'M8 7v4', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }),
        svg('circle', { cx: '8', cy: '4.75', r: '0.9', fill: 'currentColor' })
    );
}

export function createDemoNotice(): View {
    let open = false;
    let tip: HTMLSpanElement | undefined;

    const trigger = h(
        'button',
        {
            type: 'button',
            class: 'wa-notice-trigger',
            'aria-label': 'About this demo',
            onmouseenter: () => setOpen(true),
            onmouseleave: () => setOpen(false),
            onfocus: () => setOpen(true),
            onblur: () => setOpen(false),
            onkeydown: (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false),
        },
        infoIcon()
    );
    const el = h('span', { class: 'wa-notice' }, trigger);

    function setOpen(next: boolean) {
        if (next === open) return;
        open = next;
        if (open) {
            trigger.setAttribute('aria-describedby', NOTICE_ID);
            tip = h(
                'span',
                { id: NOTICE_ID, role: 'tooltip', class: 'wa-notice-tip' },
                'This is a sample application showcasing AG Charts and AG Grid features. All data shown is synthetic and randomly generated for demonstration purposes only.'
            );
            el.append(tip);
        } else {
            trigger.removeAttribute('aria-describedby');
            tip?.remove();
            tip = undefined;
        }
    }

    return staticView(el);
}
