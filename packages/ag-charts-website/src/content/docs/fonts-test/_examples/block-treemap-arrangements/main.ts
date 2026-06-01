import { AgChartOptions, AgCharts, AnimationModule, ModuleRegistry, TreemapSeriesModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AnimationModule, TreemapSeriesModule]);

const icon = (letter: string, fill: string, size = 36) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
            `<rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="6" fill="${fill}"/>` +
            `<text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-family="Verdana" font-size="${Math.round(size / 2)}" fill="white" font-weight="bold">${letter}</text></svg>`
    )}`;

const A = icon('A', '#1f77b4');
const B = icon('B', '#d62728');
const C = icon('C', '#2ca02c');
const TALL = icon('T', '#9467bd');
const INLINE = icon('i', '#ff7f0e');

type Layout =
    | 'leading'
    | 'stacked-rows'
    | 'inline-trailing'
    | 'side-by-side-2'
    | 'side-by-side-3'
    | 'block-inline-mix'
    | 'valign-top'
    | 'valign-bottom'
    | 'decor-padding'
    | 'decor-border'
    | 'oversized-hide'
    | 'long-wrap';

interface TileDatum {
    name: string;
    value: number;
    layout: Layout;
}

// Each tile demonstrates a distinct block-image arrangement / edge case so regressions in any one
// surface visually in a single chart.
const data: TileDatum[] = [
    { name: 'leading', value: 100, layout: 'leading' },
    { name: 'stacked rows', value: 100, layout: 'stacked-rows' },
    { name: 'inline trailing', value: 100, layout: 'inline-trailing' },
    { name: 'two side-by-side', value: 100, layout: 'side-by-side-2' },
    { name: 'three side-by-side', value: 100, layout: 'side-by-side-3' },
    { name: 'block + inline', value: 100, layout: 'block-inline-mix' },
    { name: 'valign top', value: 100, layout: 'valign-top' },
    { name: 'valign bottom', value: 100, layout: 'valign-bottom' },
    { name: 'padding + fill', value: 100, layout: 'decor-padding' },
    { name: 'border + radius', value: 100, layout: 'decor-border' },
    { name: 'oversized hide', value: 100, layout: 'oversized-hide' },
    { name: 'long wrap', value: 100, layout: 'long-wrap' },
];

const formatLabel = (datum: TileDatum) => {
    switch (datum.layout) {
        case 'leading':
            return [
                { type: 'image' as const, url: A, width: 32, height: 32, block: true, borderRadius: 6 },
                { text: 'Leading', fontWeight: 'bold' as const },
                { text: '\nblock image' },
            ];
        case 'stacked-rows':
            // block, text, `\n`, block, text → two stacked block rows.
            return [
                { type: 'image' as const, url: A, width: 28, height: 28, block: true, borderRadius: 6 },
                { text: 'Row one', fontWeight: 'bold' as const },
                { text: '\nmore text\n' },
                { type: 'image' as const, url: B, width: 28, height: 28, block: true, borderRadius: 6 },
                { text: 'Row two' },
            ];
        case 'inline-trailing':
            // Same shape as stacked-rows but NO `\n` before the second block, so it renders inline.
            return [
                { type: 'image' as const, url: A, width: 28, height: 28, block: true, borderRadius: 6 },
                { text: 'Alpha ', fontWeight: 'bold' as const },
                { text: 'beta' },
                { type: 'image' as const, url: B, width: 28, height: 28, block: true, borderRadius: 6 },
                { text: 'Gamma' },
            ];
        case 'side-by-side-2':
            return [
                { type: 'image' as const, url: A, width: 26, height: 26, block: true },
                { type: 'image' as const, url: B, width: 26, height: 26, block: true },
                { text: 'Two icons', fontWeight: 'bold' as const },
            ];
        case 'side-by-side-3':
            return [
                { type: 'image' as const, url: A, width: 24, height: 24, block: true },
                { type: 'image' as const, url: B, width: 24, height: 24, block: true },
                { type: 'image' as const, url: C, width: 24, height: 24, block: true },
                { text: 'Three icons' },
            ];
        case 'block-inline-mix':
            return [
                { type: 'image' as const, url: A, width: 30, height: 30, block: true, borderRadius: 6 },
                { text: 'Name ', fontWeight: 'bold' as const },
                { type: 'image' as const, url: INLINE, width: 16, height: 16, verticalAlign: 'middle' as const },
                { text: ' tag' },
            ];
        case 'valign-top':
            return [
                {
                    type: 'image' as const,
                    url: TALL,
                    width: 28,
                    height: 56,
                    block: true,
                    verticalAlign: 'top' as const,
                },
                { text: 'Tall image,\ntext aligned top' },
            ];
        case 'valign-bottom':
            return [
                {
                    type: 'image' as const,
                    url: TALL,
                    width: 28,
                    height: 56,
                    block: true,
                    verticalAlign: 'bottom' as const,
                },
                { text: 'Tall image,\ntext aligned bottom', verticalAlign: 'bottom' as const },
            ];
        case 'decor-padding':
            return [
                {
                    type: 'image' as const,
                    url: A,
                    width: 30,
                    height: 30,
                    block: true,
                    padding: { top: 4, right: 10, bottom: 4, left: 2 },
                    backgroundFill: 'rgba(0,0,0,0.3)',
                },
                { text: 'Asymmetric padding\n+ background fill' },
            ];
        case 'decor-border':
            return [
                {
                    type: 'image' as const,
                    url: A,
                    width: 30,
                    height: 30,
                    block: true,
                    padding: 4,
                    borderRadius: 10,
                    border: { enabled: true, stroke: '#222', strokeWidth: 2 },
                },
                { text: 'Border + radius' },
            ];
        case 'oversized-hide':
            // Image far larger than the tile — default `hide` drops it, keeping the text.
            return [
                { type: 'image' as const, url: B, width: 4000, height: 4000, block: true },
                { text: 'Oversized image dropped\n(text survives)' },
            ];
        case 'long-wrap':
            return [
                { type: 'image' as const, url: A, width: 28, height: 28, block: true, borderRadius: 6 },
                {
                    text: 'A long label that should wrap into the narrow column beside the block image',
                    fontWeight: 'bold' as const,
                },
            ];
    }
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Block image arrangements (one edge case per tile)' },
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'value',
            tile: {
                label: {
                    fontSize: 14,
                    minimumFontSize: 8,
                    spacing: 2,
                    formatter: ({ datum }) => formatLabel(datum as TileDatum),
                },
                secondaryLabel: { enabled: false },
            },
        },
    ],
};

AgCharts.create(options);
