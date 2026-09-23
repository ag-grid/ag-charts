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

// The demo fills the viewport from a fixed-position container of its own, which would leave this
// wrapper with no box; sizing it to the viewport keeps it visible to tooling. In the demos app the
// loading fallback does that while the demo's chunk loads.
createRoot(container).render(
    <main data-demo-id="web-analytics" style={{ position: 'fixed', inset: 0 }}>
        <Demo />
    </main>
);
