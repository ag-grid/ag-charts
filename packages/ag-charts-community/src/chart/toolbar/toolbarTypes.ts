export const TOOLBAR_ALIGNMENTS = ['start', 'center', 'end'] as const;
export type ToolbarAlignment = (typeof TOOLBAR_ALIGNMENTS)[number];

export const TOOLBAR_GROUPS = ['annotations', 'annotationOptions', 'ranges', 'zoom'] as const;
export type ToolbarGroup = (typeof TOOLBAR_GROUPS)[number];

export enum ToolbarPosition {
    Top = 'top',
    Right = 'right',
    Bottom = 'bottom',
    Left = 'left',
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

export interface ToolbarButton {
    section?: string;
    icon?: string;
    label?: string;
    tooltip?: string;
    value: any;
}
