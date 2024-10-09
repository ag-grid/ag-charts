export type AgIconName =
    | 'align-center'
    | 'align-left'
    | 'align-right'
    | 'arrow-drawing'
    | 'arrow-down-drawing'
    | 'arrow-up-drawing'
    | 'callout-annotation'
    | 'candlestick-series'
    | 'close'
    | 'comment-annotation'
    | 'date-range-drawing'
    | 'date-price-range-drawing'
    | 'delete'
    | 'disjoint-channel-drawing'
    | 'drag-handle'
    | 'fill-color'
    | 'line-style-solid'
    | 'line-style-dashed'
    | 'line-style-dotted'
    | 'high-low-series'
    | 'hlc-series'
    | 'hollow-candlestick-series'
    | 'horizontal-line-drawing'
    | 'line-color'
    | 'line-series'
    | 'line-with-markers-series'
    | 'locked'
    | 'measurer-drawing'
    | 'note-annotation'
    | 'ohlc-series'
    | 'pan-end'
    | 'pan-left'
    | 'pan-right'
    | 'pan-start'
    | 'parallel-channel-drawing'
    | 'position-bottom'
    | 'position-center'
    | 'position-top'
    | 'price-label-annotation'
    | 'price-range-drawing'
    | 'reset'
    | 'settings'
    | 'step-line-series'
    | 'text-annotation'
    | 'trend-line-drawing'
    | 'unlocked'
    | 'vertical-line-drawing'
    | 'zoom-in'
    | 'zoom-out'
    | AgIconLegacyName;

/** @deprecated */
export type AgIconLegacyName =
    | 'delete-legacy'
    | 'disjoint-channel'
    | 'disjoint-channel-legacy'
    | 'horizontal-line'
    | 'horizontal-line-legacy'
    | 'line-color-legacy'
    | 'lock'
    | 'lock-legacy'
    | 'pan-end-legacy'
    | 'pan-left-legacy'
    | 'pan-right-legacy'
    | 'pan-start-legacy'
    | 'parallel-channel'
    | 'parallel-channel-legacy'
    | 'reset-legacy'
    | 'trend-line'
    | 'trend-line-legacy'
    | 'unlock'
    | 'unlock-legacy'
    | 'vertical-line'
    | 'vertical-line-legacy'
    | 'zoom-in-legacy'
    | 'zoom-in-alt'
    | 'zoom-in-alt-legacy'
    | 'zoom-out-legacy'
    | 'zoom-out-alt'
    | 'zoom-out-alt-legacy';

// Duplicated as docs can not handle `type AgIconLegacyName = typeof ICONS_LEGACY`, but need the array for validation.
export const ICONS_LEGACY = [
    'delete-legacy',
    'disjoint-channel',
    'disjoint-channel-legacy',
    'horizontal-line-legacy',
    'line-color-legacy',
    'lock',
    'lock-legacy',
    'pan-end-legacy',
    'pan-left-legacy',
    'pan-right-legacy',
    'pan-start-legacy',
    'parallel-channel',
    'parallel-channel-legacy',
    'reset-legacy',
    'trend-line',
    'trend-line-legacy',
    'unlock',
    'unlock-legacy',
    'vertical-line',
    'vertical-line-legacy',
    'zoom-in-legacy',
    'zoom-in-alt',
    'zoom-in-alt-legacy',
    'zoom-out-legacy',
    'zoom-out-alt',
    'zoom-out-alt-legacy',
] as Array<AgIconLegacyName>;
