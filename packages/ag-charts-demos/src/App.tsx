import { Suspense, lazy, useEffect, useMemo, useState } from 'react';

import { DEMO_APPS } from './registry';

const readHashId = () => window.location.hash.replace(/^#/, '');

export const App = () => {
    const [id, setId] = useState(readHashId);

    useEffect(() => {
        const onHashChange = () => setId(readHashId());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const entry = useMemo(() => (id ? DEMO_APPS.find((app) => app.id === id) : DEMO_APPS[0]), [id]);
    const LazyApp = useMemo(() => (entry ? lazy(entry.load) : null), [entry]);

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
            <Suspense fallback={<p>Loading demo…</p>}>
                <LazyApp />
            </Suspense>
        </main>
    );
};
