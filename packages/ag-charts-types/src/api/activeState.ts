export interface AgActiveItemState {
    /** Where the item activation originates from. */
    type: 'series-node' | 'legend';
    /** The unique identifier of the series that this picked datum belongs to. */
    seriesId: string;
    /** The unique identifier of the picked datum. */
    itemId: string | number;
}

export interface AgActiveState {
    /**
     * The active series datum shape. If the entire series is active, then `itemId` will be set to `undefined`.
     */
    activeItem?: AgActiveItemState;
}
