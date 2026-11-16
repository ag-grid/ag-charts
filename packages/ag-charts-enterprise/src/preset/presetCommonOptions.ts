import { type OptionsDefs, boolean, defined, string, validationsOptionsDef } from 'ag-charts-core';
import type { AgBasePresetOptions } from 'ag-charts-types';

export const basePresetOptionsDefs: OptionsDefs<AgBasePresetOptions> = {
    border: defined,
    keyboard: defined,
    loadGoogleFonts: boolean,
    styleNonce: string,
    validations: validationsOptionsDef,
};
