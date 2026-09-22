import type { AttentionAction, AttentionItem } from '../types';
import { Button } from '../ui';

const SEVERITY_GLYPH = { bad: '▲' } as const;

interface AttentionListProps {
    items: AttentionItem[];
    /** Selecting an item selects its shipment on the orders tab, where the worklist lives. */
    onSelect: (shipmentId: string) => void;
    /** Taking a decision resolves the item in place, removing it from the list. */
    onResolve: (item: AttentionItem, action: AttentionAction) => void;
}

/**
 * The first thing she sees: what needs a decision from her today, with the decisions
 * available in place.
 *
 * Deliberately not a chart. A workspace opens on what its owner has to do; a dashboard opens
 * on a summary of what happened. Each item resolves here and disappears, so the list is a
 * worklist that empties rather than a feed that accumulates.
 */
export function AttentionList({ items, onSelect, onResolve }: AttentionListProps) {
    if (items.length === 0) {
        return (
            <div className="pc-attention-clear">
                <span className="pc-attention-clear-glyph" aria-hidden="true">
                    ✓
                </span>
                <span>
                    <strong>Nothing needs your attention.</strong> No shipment is projected to miss the date production
                    needs it.
                </span>
            </div>
        );
    }

    return (
        <ul className="pc-attention">
            {items.map((item) => (
                <li key={item.itemId} className={`pc-attention-item is-${item.severity}`}>
                    <span className="pc-attention-glyph" aria-hidden="true">
                        {SEVERITY_GLYPH[item.severity]}
                    </span>
                    <button type="button" className="pc-attention-body" onClick={() => onSelect(item.shipmentId)}>
                        <span className="pc-attention-title">{item.title}</span>
                        <span className="pc-attention-detail">{item.detail}</span>
                    </button>
                    <span className="pc-attention-actions">
                        {item.actions.map((action) => (
                            <Button key={action.id} className="pc-btn-sm" onClick={() => onResolve(item, action)}>
                                {action.label}
                            </Button>
                        ))}
                    </span>
                </li>
            ))}
        </ul>
    );
}
