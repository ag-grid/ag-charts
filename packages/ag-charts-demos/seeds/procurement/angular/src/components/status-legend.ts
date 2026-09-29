import { Component } from '@angular/core';

import { STATUS_ICONS } from '../chartTheme';
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
 *
 * The host is the React root `.pc-legend`.
 */
@Component({
    selector: 'div[pcStatusLegend]',
    host: { class: 'pc-legend' },
    template: `
        @for (status of statuses; track status) {
            <span [class]="'pc-legend-item ' + statusClass[status]"
                ><span class="pc-legend-glyph" aria-hidden="true">{{ statusIcons[status] }}</span
                >{{ status }}</span
            >
        }
    `,
})
export class StatusLegend {
    protected readonly statuses = STATUSES;
    protected readonly statusClass = STATUS_CLASS;
    protected readonly statusIcons = STATUS_ICONS;
}
