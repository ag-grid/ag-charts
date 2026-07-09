import { Suspense, lazy, useEffect, useMemo, useState } from 'react';

import { DEMO_APPS } from './registry';

const currentId = () => window.location.hash.replace(/^#/, '') || DEMO_APPS[0].id;

export const App = () => {
    const [id, setId] = useState(currentId);

    useEffect(() => {
        const onHashChange = () => setId(currentId());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const entry = DEMO_APPS.find((app) => app.id === id) ?? DEMO_APPS[0];
    const LazyApp = useMemo(() => lazy(entry.load), [entry]);

    return (
        <Suspense fallback={<p>Loading demo…</p>}>
            <LazyApp />
        </Suspense>
    );
};
