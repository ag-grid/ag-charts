import { Suspense, lazy, useEffect, useMemo, useState } from 'react';

import { LoadingDemo } from './LoadingDemo';
import { beforeFirstRender } from './fonts';
import { DEMO_APPS, type DemoAppEntry } from './registry';

const readHashId = () => window.location.hash.replace(/^#/, '');

// When embedded (website dev server) the host fixes the demo via #root[data-demo-id];
// the standalone server has no such attribute and selects via the URL hash instead.
const readInitialId = () => document.getElementById('root')?.dataset.demoId ?? readHashId();

// A demo's stylesheet, and with it the `@font-face` rules for its web fonts, arrives with its
// chunk. In an e2e run (the deterministic switch) the fonts are then loaded before the demo
// renders, so its charts lay out in their final font from the first frame, as the parity harness
// needs (see fonts.ts); the Suspense fallback stays up for the wait. A normal load renders at once.
async function loadWithFonts(entry: DemoAppEntry) {
    const module = await entry.load();
    await beforeFirstRender();
    return module;
}

export const App = () => {
    const [id, setId] = useState(readInitialId);

    useEffect(() => {
        const onHashChange = () => setId(readHashId());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const entry = useMemo(() => (id === '' ? DEMO_APPS[0] : DEMO_APPS.find((app) => app.id === id)), [id]);
    const LazyApp = useMemo(() => (entry ? lazy(() => loadWithFonts(entry)) : null), [entry]);

    if (!entry || !LazyApp) {
        return (
            <main data-demo-id="__unknown__">
                <h1>Unknown demo</h1>
                <p>No demo app is registered for the id “{id}”.</p>
            </main>
        );
    }

    return (
        <main data-demo-id={entry.id}>
            <Suspense fallback={<LoadingDemo />}>
                <LazyApp />
            </Suspense>
        </main>
    );
};
