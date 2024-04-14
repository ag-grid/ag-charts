import type { PlainObject } from '../../util/types';
import { type OptionsDefs, union } from '../util/validation';

export const themeOptionsDef: OptionsDefs<PlainObject> = {
    baseTheme: union(
        'ag-default',
        'ag-default-dark',
        'ag-material',
        'ag-material-dark',
        'ag-polychroma',
        'ag-polychroma-dark',
        'ag-sheets',
        'ag-sheets-dark',
        'ag-vivid',
        'ag-vivid-dark'
    ),

    variables: {},
    overrides: {},
    axesDefaults: {},
    axisTypeDefaults: {},
    seriesDefaults: {},
    seriesTypeDefaults: {},
};
