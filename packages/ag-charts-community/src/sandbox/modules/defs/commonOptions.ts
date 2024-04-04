import { type OptionsDefs, boolean, callback, optional, string } from '../../util/validation';

export interface CommonSeriesOptions {
    visible?: boolean;
    showInLegend?: boolean;
    cursor?: string;
    onNodeClick?: (event: object) => void;
    onNodeDoubleClick?: (event: object) => void;
}

export const commonSeriesOptionsDefs: OptionsDefs<keyof CommonSeriesOptions> = {
    visible: optional(boolean),
    showInLegend: optional(boolean),
    cursor: optional(string),
    onNodeClick: optional(callback),
    onNodeDoubleClick: optional(callback),
};
