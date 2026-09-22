import { createRoot } from 'react-dom/client';

import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import { waitForDeclaredFonts } from './fonts';
import Demo from './index';

// The demo registers the modules it needs in ./index.tsx; the community bundle is
// registered here as well so every demo starts from the same baseline.
ModuleRegistry.registerModules([AllCommunityModule]);

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root not found');
}

// The stylesheet ./index.tsx imports declares the demo's web fonts; they are loaded before the
// first render so the charts lay out in their final font from the first frame (see ./fonts.ts).
void waitForDeclaredFonts().then(() => {
    // The demo fills the viewport from a fixed-position container of its own, which would leave
    // this wrapper with no box; sizing it to the viewport keeps it visible to tooling. In the demos
    // app the loading fallback does that while the demo's chunk loads.
    createRoot(container).render(
        <main data-demo-id="procurement" style={{ position: 'fixed', inset: 0 }}>
            <Demo />
        </main>
    );
});
