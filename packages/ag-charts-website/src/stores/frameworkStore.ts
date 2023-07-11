import { atom } from 'nanostores';
import { InternalFramework } from '../types/ag-grid.d';

const DEFAULT_INTERNAL_FRAMEWORK: InternalFramework = 'vanilla';

export const currentInternalFramework = atom(DEFAULT_INTERNAL_FRAMEWORK);
