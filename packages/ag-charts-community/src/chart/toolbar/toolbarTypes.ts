export type ToolbarAlignment = 'start' | 'center' | 'end';
export const TOOLBAR_ALIGNMENTS: ToolbarAlignment[] = ['start', 'center', 'end'];

export type ToolbarPosition = 'top' | 'right' | 'bottom' | 'left';
export const TOOLBAR_POSITIONS: ToolbarPosition[] = ['top', 'right', 'bottom', 'left'];

export interface ToolbarButton {
    icon?: string;
    label?: string;
    value: any;
}
