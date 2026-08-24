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
 */
export function StatusLegend() {
    return (
        <div className="pc-legend">
            {STATUSES.map((status) => (
                <span key={status} className={`pc-legend-item ${STATUS_CLASS[status]}`}>
                    <span className="pc-legend-glyph" aria-hidden="true">
                        {STATUS_ICONS[status]}
                    </span>
                    {status}
                </span>
            ))}
        </div>
    );
}
