import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { createTradingTerminalApp } from './TradingTerminalApp';
import { type View } from './dom';
import './trading-terminal.css';

// Candlestick/OHLC series, crosshairs, chart sync, zoom and the navigator are
// all enterprise features, so register the enterprise bundle for this demo.
ModuleRegistry.registerModules([AllEnterpriseModule]);

export default function createTradingTerminal(): View {
    return createTradingTerminalApp();
}
