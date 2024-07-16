export type ToolbarAlignment = 'start' | 'center' | 'end';
export declare const TOOLBAR_ALIGNMENTS: ToolbarAlignment[];
export type ToolbarGroup = 'annotations' | 'ranges' | 'zoom';
export declare const TOOLBAR_GROUPS: ToolbarGroup[];
export declare enum ToolbarPosition {
    Top = "top",
    Right = "right",
    Bottom = "bottom",
    Left = "left",
    FloatingTop = "floating-top",
    FloatingBottom = "floating-bottom"
}
export declare const TOOLBAR_POSITIONS: ToolbarPosition[];
export interface ToolbarButton {
    icon?: string;
    label?: string;
    tooltip?: string;
    value: any;
}
