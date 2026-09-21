import { createRoot } from 'react-dom/client';

import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import Demo from './index';

// The demo registers the modules it needs in ./index.tsx; the community bundle is
// registered here as well so every demo starts from the same baseline.
ModuleRegistry.registerModules([AllCommunityModule]);

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root not found');
}

createRoot(container).render(
    <main data-demo-id="procurement">
        <Demo />
    </main>
);
