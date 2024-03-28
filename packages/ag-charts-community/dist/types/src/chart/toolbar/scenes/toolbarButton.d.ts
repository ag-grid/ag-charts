import { Group } from '../../../scene/group';
export declare class ToolbarButton extends Group {
    private button;
    private label;
    constructor(opts: {
        label: string;
        width: number;
        height: number;
    });
    containsPoint(x: number, y: number): boolean;
}
