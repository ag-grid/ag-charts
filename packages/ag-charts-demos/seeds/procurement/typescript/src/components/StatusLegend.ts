import { STATUS_ICONS } from '../chartTheme';
import { h } from '../dom';
import type { ShipmentStatus } from '../types';

/** Status → the CSS modifier carrying its ink, shared by tiles, cells and this legend. */
export const STATUS_CLASS: Record<ShipmentStatus, string> = {
    'On time': 'is-ok',
    'At risk': 'is-warn',
    Late: 'is-bad',
};

const STATUSES: ShipmentStatus[] = ['On time', 'At risk', 'Late'];

/**
 * Shared status key for the board and the map. Rendered as HTML rather than a chart
 * legend so it can carry the same glyphs the tiles and grid cells use — the glyph is the
 * non-colour channel for status, and it has to be the same one everywhere.
 */
export function statusLegend(): HTMLDivElement {
    return h(
        'div',
        { class: 'pc-legend' },
        ...STATUSES.map((status) =>
            h(
                'span',
                { class: `pc-legend-item ${STATUS_CLASS[status]}` },
                h('span', { class: 'pc-legend-glyph', 'aria-hidden': 'true' }, STATUS_ICONS[status]),
                status
            )
        )
    );
}
