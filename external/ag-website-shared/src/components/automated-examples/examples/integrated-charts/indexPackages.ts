/**
 * Automated Integrated Charts demo
 */
import { createGrid } from 'ag-grid-community';
import 'ag-grid-enterprise';

import { type AutomatedExample } from '../../types.d';
import {
    type CreateAutomatedIntegratedChartsParams,
    createAutomatedIntegratedChartsWithCreateGrid,
} from './createAutomatedIntegratedChartsWithCreateGrid';

/**
 * Create automated integrated charts example using packages
 */
export function createAutomatedIntegratedCharts(params: CreateAutomatedIntegratedChartsParams): AutomatedExample {
    return createAutomatedIntegratedChartsWithCreateGrid({
        createGrid,
        ...params,
    });
}
