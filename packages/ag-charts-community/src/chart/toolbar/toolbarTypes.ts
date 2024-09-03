import type { AgIconName } from 'ag-charts-types';

export const TOOLBAR_ALIGNMENTS = ['start', 'center', 'end'] as const;
export type ToolbarAlignment = (typeof TOOLBAR_ALIGNMENTS)[number];

export const TOOLBAR_GROUPS = ['seriesType', 'annotations', 'annotationOptions', 'ranges', 'zoom'] as const;
export type ToolbarGroup = (typeof TOOLBAR_GROUPS)[number];

export const TOOLBAR_GROUP_ORDERING: Record<ToolbarGroup, number> = {
    seriesType: 0,
    annotations: 1,
    annotationOptions: 2,
    ranges: 3,
    zoom: 4,
};

export enum ToolbarPosition {
    Top = 'top',
    Left = 'left',
    Right = 'right',
    Bottom = 'bottom',
    Floating = 'floating',
    FloatingTop = 'floating-top',
    FloatingBottom = 'floating-bottom',
}
export const TOOLBAR_POSITIONS = Object.values(ToolbarPosition);

export function isAnimatingFloatingPosition(
    position: ToolbarPosition
): position is ToolbarPosition.FloatingTop | ToolbarPosition.FloatingBottom {
    return [ToolbarPosition.FloatingTop, ToolbarPosition.FloatingBottom].includes(position);
}

export interface ToolbarButtonConfig {
    icon?: AgIconName;
    label?: string;
    ariaLabel?: string;
    tooltip?: string;
}

export interface ToolbarButton extends ToolbarButtonConfig {
    section?: string;
    value: any;
    id?: string;
    role?: 'button' | 'switch';
    checkedOverrides?: ToolbarButtonConfig;
}

export interface ToolbarAnchor {
    x: number;
    y: number;
    position?: 'above' | 'above-left' | 'right' | 'below';
}
