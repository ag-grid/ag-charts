export declare const TOOLBAR_ALIGNMENTS: readonly ["start", "center", "end"];
export type ToolbarAlignment = (typeof TOOLBAR_ALIGNMENTS)[number];
export declare const TOOLBAR_GROUPS: readonly ["annotations", "annotationOptions", "ranges", "zoom"];
export type ToolbarGroup = (typeof TOOLBAR_GROUPS)[number];
export declare enum ToolbarPosition {
    Top = "top",
    Right = "right",
    Bottom = "bottom",
    Left = "left",
    Floating = "floating",
    FloatingTop = "floating-top",
    FloatingBottom = "floating-bottom"
}
export declare const TOOLBAR_POSITIONS: ToolbarPosition[];
export declare function isAnimatingFloatingPosition(position: ToolbarPosition): position is ToolbarPosition.FloatingTop | ToolbarPosition.FloatingBottom;
export interface ToolbarButton {
    section?: string;
    icon?: string;
    label?: string;
    ariaLabel?: string;
    tooltip?: string;
    value: any;
}
