import type { AgContextMenuOptions } from 'ag-charts-types';

import type { Normalised } from './normalise';

export type NormalisedContextMenuOptions = Normalised<
    AgContextMenuOptions,
    'enabled' | 'allowBrowserMenuWithModifierKey'
>;
