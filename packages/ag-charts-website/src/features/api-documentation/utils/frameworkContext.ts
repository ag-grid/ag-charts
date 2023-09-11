import type { Framework } from '@ag-grid-types';
import { createContext } from 'react';

export const FrameworkContext = createContext<Framework>('javascript');
