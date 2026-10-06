import type { AgErrorBarOptions, CssColor, ErrorBarCapOptions } from 'ag-charts-types';

import type { Normalised } from './normalise';

export type NormalisedErrorBarCapOptions = Normalised<ErrorBarCapOptions, 'lengthRatio', { stroke?: CssColor }>;

export type NormalisedErrorBarOptions = Normalised<
    AgErrorBarOptions<unknown, unknown>,
    'visible' | 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'cap',
    { stroke?: CssColor; cap?: NormalisedErrorBarCapOptions }
>;
