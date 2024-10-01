import type { AgAnnotationLineStyleType } from 'ag-charts-community';

import type { MenuItem } from '../../components/menu/menu';
import { AnnotationType } from './annotationTypes';

export enum AnnotationOptions {
    Delete = 'delete',
    LineStrokeWidth = 'line-stroke-width',
    LineStyleType = 'line-style-type',
    LineColor = 'line-color',
    FillColor = 'fill-color',
    Lock = 'lock',
    TextColor = 'text-color',
    TextSize = 'text-size',
    Settings = 'settings',
}

export const LINE_ANNOTATION_ITEMS: MenuItem<AnnotationType>[] = [
    {
        label: 'toolbarAnnotationsTrendLine',
        icon: 'trend-line-drawing',
        value: AnnotationType.Line,
    },
    {
        label: 'toolbarAnnotationsHorizontalLine',
        icon: 'horizontal-line-drawing',
        value: AnnotationType.HorizontalLine,
    },
    {
        label: 'toolbarAnnotationsVerticalLine',
        icon: 'vertical-line-drawing',
        value: AnnotationType.VerticalLine,
    },
    {
        label: 'toolbarAnnotationsParallelChannel',
        icon: 'parallel-channel-drawing',
        value: AnnotationType.ParallelChannel,
    },
    {
        label: 'toolbarAnnotationsDisjointChannel',
        icon: 'disjoint-channel-drawing',
        value: AnnotationType.DisjointChannel,
    },
];

export const TEXT_ANNOTATION_ITEMS: MenuItem<AnnotationType>[] = [
    { label: 'toolbarAnnotationsText', icon: 'text-annotation', value: AnnotationType.Text },
    { label: 'toolbarAnnotationsComment', icon: 'comment-annotation', value: AnnotationType.Comment },
    { label: 'toolbarAnnotationsCallout', icon: 'callout-annotation', value: AnnotationType.Callout },
    { label: 'toolbarAnnotationsNote', icon: 'note-annotation', value: AnnotationType.Note },
];

export const SHAPE_ANNOTATION_ITEMS: MenuItem<AnnotationType>[] = [
    { label: 'toolbarAnnotationsArrow', icon: 'arrow-drawing', value: AnnotationType.Arrow },
    { label: 'toolbarAnnotationsArrowUp', icon: 'arrow-up-drawing', value: AnnotationType.ArrowUp },
    { label: 'toolbarAnnotationsArrowDown', icon: 'arrow-down-drawing', value: AnnotationType.ArrowDown },
];

export const LINE_STROKE_WIDTH_ITEMS: MenuItem<number>[] = [
    { strokeWidth: 1, label: '1', value: 1 },
    { strokeWidth: 2, label: '2', value: 2 },
    { strokeWidth: 3, label: '3', value: 3 },
    { strokeWidth: 4, label: '4', value: 4 },
    { strokeWidth: 8, label: '8', value: 8 },
];

export const LINE_STYLE_TYPE_ITEMS: MenuItem<AgAnnotationLineStyleType>[] = [
    { icon: 'line-style-solid', altText: 'iconAltTextLineStyleSolid', value: 'solid' },
    { icon: 'line-style-dashed', altText: 'iconAltTextLineStyleDashed', value: 'dashed' },
    { icon: 'line-style-dotted', altText: 'iconAltTextLineStyleDotted', value: 'dotted' },
];

export const TEXT_SIZE_ITEMS: MenuItem<number>[] = [
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
