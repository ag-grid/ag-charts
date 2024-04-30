import { BaseProperties } from '../../util/properties';
import { type ToolbarAlignment, type ToolbarButton, ToolbarPosition } from './toolbarTypes';
export declare class ToolbarGroupProperties extends BaseProperties {
    private readonly onChange;
    private readonly onButtonsChange;
    enabled?: boolean;
    align: ToolbarAlignment;
    position: ToolbarPosition;
    buttons?: Array<ToolbarButton>;
    constructor(onChange: (enabled?: boolean) => void, onButtonsChange: (buttons?: Array<ToolbarButton>) => void);
}
