import type { AgAnnotationLineStyleType, _ModuleSupport } from 'ag-charts-community';

export const LINE_STROKE_WIDTH_ITEMS: _ModuleSupport.MenuItemOptions<number>[] = [
    { strokeWidth: 1, label: '1', value: 1 },
    { strokeWidth: 2, label: '2', value: 2 },
    { strokeWidth: 3, label: '3', value: 3 },
    { strokeWidth: 4, label: '4', value: 4 },
    { strokeWidth: 8, label: '8', value: 8 },
];

export const LINE_STYLE_TYPE_ITEMS: _ModuleSupport.MenuItemOptions<AgAnnotationLineStyleType>[] = [
    { icon: 'line-style-solid', altText: 'iconAltTextLineStyleSolid', value: 'solid' },
    { icon: 'line-style-dashed', altText: 'iconAltTextLineStyleDashed', value: 'dashed' },
    { icon: 'line-style-dotted', altText: 'iconAltTextLineStyleDotted', value: 'dotted' },
];

export const TEXT_SIZE_ITEMS: _ModuleSupport.MenuItemOptions<number>[] = [
    { label: '10', value: 10 },
    { label: '12', value: 12 },
    { label: '14', value: 14 },
    { label: '16', value: 16 },
    { label: '18', value: 18 },
    { label: '22', value: 22 },
    { label: '28', value: 28 },
    { label: '36', value: 36 },
    { label: '46', value: 46 },
];
