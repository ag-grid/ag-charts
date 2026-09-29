import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { createFinancialApp } from './FinancialApp';
import { type View } from './dom';
import './financial.css';

// Candlestick/OHLC series, crosshairs, chart sync, zoom and the navigator are
// all enterprise features, so register the enterprise bundle for this demo.
ModuleRegistry.registerModules([AllEnterpriseModule]);

export default function createFinancial(): View {
    return createFinancialApp();
}
