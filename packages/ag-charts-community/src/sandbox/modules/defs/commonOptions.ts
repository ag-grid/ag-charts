import { type OptionsDefs, boolean, callback, required, string } from '../../util/validation';

export interface CommonSeriesOptions {
    visible?: boolean;
    showInLegend?: boolean;
    cursor?: string;
    onNodeClick?: (event: object) => void;
    onNodeDoubleClick?: (event: object) => void;
}

export const commonSeriesOptionsDefs: OptionsDefs<keyof CommonSeriesOptions> = {
    visible: required(boolean),
    showInLegend: required(boolean),
    cursor: required(string),
    onNodeClick: required(callback),
    onNodeDoubleClick: required(callback),
};
