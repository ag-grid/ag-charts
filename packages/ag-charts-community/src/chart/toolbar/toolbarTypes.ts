export type ToolbarAlignment = 'start' | 'center' | 'end';
export const TOOLBAR_ALIGNMENTS: ToolbarAlignment[] = ['start', 'center', 'end'];

export type ToolbarGroup = 'annotations' | 'ranges' | 'zoom';
export const TOOLBAR_GROUPS: ToolbarGroup[] = ['annotations', 'ranges', 'zoom'];

export enum ToolbarPosition {
    Top = 'top',
    Right = 'right',
    Bottom = 'bottom',
    Left = 'left',
    FloatingTop = 'floating-top',
    FloatingBottom = 'floating-bottom',
}

export function isFloatingPosition(
    position: ToolbarPosition
): position is ToolbarPosition.FloatingTop | ToolbarPosition.FloatingBottom {
    return ['floating-top', 'floating-bottom'].includes(position);
}

export const TOOLBAR_POSITIONS: ToolbarPosition[] = Object.values(ToolbarPosition);

export interface ToolbarButton {
    icon?: string;
    label?: string;
    tooltip?: string;
    value: any;
}
