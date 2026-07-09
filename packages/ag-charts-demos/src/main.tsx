import { createRoot } from 'react-dom/client';

import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import { App } from './App';

// Register once for every demo app.
ModuleRegistry.registerModules([AllCommunityModule]);

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root not found');
}

createRoot(container).render(<App />);
