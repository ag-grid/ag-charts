import { h, svg } from '../dom';
import { createDemoInfo } from './DemoInfo';

// A fixed demo balance. Static on purpose: nothing in the demo places a trade, so a
// drifting balance would imply state that does not exist.
const DEMO_FUNDS = '$1,000.00';

// The 20-unit viewBox maps 1:1 to the rendered size, so every edge lands on a device pixel.
function appIcon() {
    return svg(
        'svg',
        {
            class: 'fin-brand-mark',
            width: '20',
            height: '20',
            viewBox: '0 0 20 20',
            'aria-hidden': 'true',
            focusable: 'false',
        },
        svg('rect', { class: 'fin-brand-mark-badge', width: '20', height: '20' }),
        svg(
            'g',
            { class: 'fin-brand-mark-glyph' },
            svg('rect', { x: '5', y: '4', width: '2', height: '14' }),
            svg('rect', { x: '3', y: '8', width: '6', height: '6' }),
            svg('rect', { x: '13', y: '2', width: '2', height: '14' }),
            svg('rect', { x: '11', y: '5', width: '6', height: '6' })
        )
    );
}

export function createToolbar(): HTMLDivElement {
    return h(
        'div',
        { class: 'fin-toolbar' },
        h('span', { class: 'fin-brand' }, appIcon(), 'AG Trade'),
        h('div', { class: 'fin-toolbar-spacer' }),
        h(
            'span',
            { class: 'fin-account' },
            h('span', { class: 'fin-account-label' }, 'Funds'),
            h('span', { class: 'fin-account-value' }, DEMO_FUNDS)
        ),
        createDemoInfo()
    );
}
