// Cases for the glow/shadow spike. Each case is { title, options, hover?: [x, y] } (hover in chart px).
const DATA = [
    { x: 'Mon', y: 42, z: 30 },
    { x: 'Tue', y: 58, z: 44 },
    { x: 'Wed', y: 36, z: 52 },
    { x: 'Thu', y: 66, z: 40 },
    { x: 'Fri', y: 50, z: 61 },
    { x: 'Sat', y: 28, z: 35 },
];
const bar = (extra = {}, series = {}) => ({
    data: DATA,
    legend: { enabled: false },
    series: [{ type: 'bar', xKey: 'x', yKey: 'y', fill: '#5090dc', ...series }],
    ...extra,
});
// hover x/y chosen to land on the 'Thu' bar in a 520x340 chart.
const HOVER = [305, 150];

window.CASES = {
    'bar-plain': { title: 'Bar: no options', options: bar(), hover: HOVER },
    'bar-latest-glow': {
        title: 'Bar: highlightedItem.glow {enabled}, as on latest',
        options: bar({}, { highlight: { highlightedItem: { glow: { enabled: true } } } }),
        hover: HOVER,
    },
    'bar-series-glow': {
        title: 'Bar: glow: {} (series level, auto-enable)',
        options: bar({}, { glow: {} }),
        hover: HOVER,
    },
    'bar-series-glow-bucket-gap': {
        title: 'Bar: glow {} + highlightedItem.glow {gap: 5}',
        options: bar({}, { glow: {}, highlight: { highlightedItem: { glow: { gap: 5 } } } }),
        hover: HOVER,
    },
    'bar-bucket-auto-enable': {
        title: 'Bar: highlightedItem.glow {gap: 5} only (auto-enable)',
        options: bar({}, { highlight: { highlightedItem: { glow: { gap: 5 } } } }),
        hover: HOVER,
    },
    'bar-bucket-disable': {
        title: 'Bar: glow {} + highlightedItem.glow {enabled:false}',
        options: bar({}, { glow: {}, highlight: { highlightedItem: { glow: { enabled: false } } } }),
        hover: HOVER,
    },
    'bar-gap-unset': {
        title: 'Bar translucent: glow, gap unset',
        options: bar({}, { fillOpacity: 0.4, highlight: { highlightedItem: { glow: { blur: 12, spread: 6 } } } }),
        hover: HOVER,
    },
    'bar-gap-0': {
        title: 'Bar translucent: glow, gap 0',
        options: bar(
            {},
            { fillOpacity: 0.4, highlight: { highlightedItem: { glow: { blur: 12, spread: 6, gap: 0 } } } }
        ),
        hover: HOVER,
    },
    'bar-gap-6': {
        title: 'Bar translucent: glow, gap 6',
        options: bar(
            {},
            { fillOpacity: 0.4, highlight: { highlightedItem: { glow: { blur: 12, spread: 6, gap: 6 } } } }
        ),
        hover: HOVER,
    },
    'bar-gap-strong': {
        title: 'Bar: strong glow, gap 12 (debug)',
        options: bar(
            {},
            {
                highlight: {
                    highlightedItem: { glow: { fill: '#e8465a', fillOpacity: 1, blur: 3, spread: 4, gap: 12 } },
                },
            }
        ),
        hover: HOVER,
    },
    'bar-shadow': {
        title: 'Bar: shadow {}',
        options: bar({}, { shadow: {} }),
        hover: HOVER,
    },
    'bar-highlighted-shadow': {
        title: 'Bar: shadow {} + highlightedItem.shadow {xOffset: 10, yOffset: 10}',
        options: bar({}, { shadow: {}, highlight: { highlightedItem: { shadow: { xOffset: 10, yOffset: 10 } } } }),
        hover: HOVER,
    },
    'bar-highlighted-shadow-only': {
        title: 'Bar: highlightedItem.shadow only (auto-enable)',
        options: bar({}, { highlight: { highlightedItem: { shadow: { xOffset: 10, yOffset: 10 } } } }),
        hover: HOVER,
    },
    'bar-shadow-and-glow': {
        title: 'Bar: shadow {} and glow {} together',
        options: bar({}, { shadow: {}, glow: { fill: '#ffb000' } }),
        hover: HOVER,
    },
    'bar-styler': {
        title: 'Bar: itemStyler returns shadow + glow for Thu',
        options: bar(
            {},
            {
                itemStyler: (p) =>
                    p.datum.x === 'Thu'
                        ? { shadow: { xOffset: 6, yOffset: 6 }, glow: { fill: '#e8465a', blur: 12, spread: 4 } }
                        : {},
            }
        ),
        hover: HOVER,
    },
};

// Other shapes. Hover points are tuned by eye against the neutral screenshots.
const SCATTER = [
    { x: 10, y: 20 },
    { x: 20, y: 45 },
    { x: 22, y: 47 },
    { x: 35, y: 30 },
    { x: 50, y: 60 },
    { x: 52, y: 58 },
    { x: 70, y: 40 },
];
const scatter = (series = {}) => ({
    data: SCATTER,
    legend: { enabled: false },
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y', size: 18, fill: '#5090dc', ...series }],
});
const line = (series = {}) => ({
    data: DATA,
    legend: { enabled: false },
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y',
            stroke: '#5090dc',
            marker: { enabled: true, size: 14, fill: '#5090dc' },
            ...series,
        },
    ],
});
const area = (series = {}) => ({
    data: DATA,
    legend: { enabled: false },
    series: [
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y',
            fill: '#5090dc',
            stroke: '#2a5fa5',
            marker: { enabled: true, size: 10 },
            ...series,
        },
    ],
});
const donut = (series = {}) => ({
    data: DATA,
    legend: { enabled: false },
    series: [{ type: 'donut', angleKey: 'y', ...series }],
});
const SANKEY = [
    { from: 'A', to: 'C', size: 10 },
    { from: 'A', to: 'D', size: 6 },
    { from: 'B', to: 'C', size: 4 },
    { from: 'B', to: 'D', size: 9 },
];
const sankey = (series = {}) => ({
    data: SANKEY,
    series: [{ type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size', ...series }],
});

Object.assign(window.CASES, {
    'scatter-series-glow': {
        title: 'Scatter: glow {} (series level, overlapping markers)',
        options: scatter({ glow: {} }),
        hover: [165, 150],
    },
    'scatter-gap': {
        title: 'Scatter: highlightedItem.glow {gap: 4}',
        options: scatter({ highlight: { highlightedItem: { glow: { gap: 4, blur: 4, spread: 6 } } } }),
        hover: [165, 150],
    },
    'scatter-styler': {
        title: 'Scatter: marker itemStyler shadow + glow',
        options: scatter({
            itemStyler: (p) =>
                p.datum.y > 55 ? { shadow: { xOffset: 5, yOffset: 5 }, glow: { fill: '#e8465a' } } : {},
        }),
    },
    'line-marker-glow': {
        title: 'Line: marker.glow {} + highlightedItem.shadow',
        options: line({
            marker: { enabled: true, size: 14, fill: '#5090dc', glow: {}, shadow: {} },
            highlight: { highlightedItem: { shadow: { xOffset: 8, yOffset: 8 } } },
        }),
        hover: [250, 150],
    },
    'line-marker-styler': {
        title: 'Line: marker.itemStyler glow + shadow on Thu',
        options: line({
            marker: {
                enabled: true,
                size: 14,
                fill: '#5090dc',
                itemStyler: (p) =>
                    p.datum.x === 'Thu'
                        ? { glow: { fill: '#e8465a', blur: 8, spread: 4 }, shadow: { xOffset: 4, yOffset: 4 } }
                        : {},
            },
        }),
    },
    'area-fill-glow': {
        title: 'Area: glow {} on the fill + marker.glow {}',
        options: area({ glow: {}, marker: { enabled: true, size: 10, glow: {} } }),
        hover: [250, 150],
    },
    'area-marker-only': {
        title: 'Area: marker.glow {} only',
        options: area({ marker: { enabled: true, size: 10, glow: {} } }),
        hover: [250, 150],
    },
    'donut-glow': { title: 'Donut: glow {}', options: donut({ glow: {} }), hover: [330, 60] },
    'donut-gap': {
        title: 'Donut: highlightedItem.glow {gap: 4}',
        options: donut({ highlight: { highlightedItem: { glow: { gap: 4, blur: 6, spread: 6 } } } }),
        hover: [330, 60],
    },
    'donut-highlighted-shadow': {
        title: 'Donut: shadow {} + highlightedItem.shadow {10, 10}',
        options: donut({ shadow: {}, highlight: { highlightedItem: { shadow: { xOffset: 10, yOffset: 10 } } } }),
        hover: [330, 60],
    },
    'sankey-node-link-glow': {
        title: 'Sankey: node.glow {} + link.glow {fill}',
        options: sankey({ node: { glow: {} }, link: { glow: { fill: '#ffb000' } } }),
        hover: [60, 90],
    },
    'sankey-highlighted-shadow': {
        title: 'Sankey: node.shadow {} + highlightedItem.shadow',
        options: sankey({
            node: { shadow: {} },
            link: { shadow: {} },
            highlight: { highlightedItem: { shadow: { xOffset: 8, yOffset: 8 } } },
        }),
        hover: [60, 90],
    },
    'bar-overlap-glow': {
        title: 'Bar: wide glow {} at neutral, neighbours overlap',
        options: bar({}, { glow: { blur: 10, spread: 8, fillOpacity: 0.6 } }),
        hover: HOVER,
    },
});
