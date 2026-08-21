import { replaceHistoryUrl } from '@ag-website-shared/utils/historyUrl';
import { navigate } from 'astro:transitions/client';
import { useEffect, useState } from 'react';

import type { NavigationData } from './apiReferenceHelpers';

// Astro's ClientRouter owns `history.state` (`index`, `scrollX`, `scrollY`) and spreads any state
// passed to `navigate()` alongside those keys, so the selection nests under one key of its own.
const SELECTION_STATE_KEY = 'apiReferenceSelection';

interface ApiReferenceLocation {
    pathname: string;
    /** Includes the leading `#`, matching `window.location.hash`. */
    hash: string;
}

const inBrowser = () => typeof window !== 'undefined';

function currentLocation(): ApiReferenceLocation | null {
    return inBrowser() ? { pathname: window.location.pathname, hash: window.location.hash } : null;
}

function hrefFor({ pathname, hash }: NavigationData) {
    return hash ? `${pathname}#${hash}` : pathname;
}

export function readSelection(): NavigationData | undefined {
    if (!inBrowser()) return undefined;
    return (history.state as Record<string, unknown> | null)?.[SELECTION_STATE_KEY] as NavigationData | undefined;
}

/**
 * Attach a selection to the current entry. Entries created by a full page load or by arriving from
 * a non-reference page carry no selection of their own, so a later back/forward has nothing to
 * restore without this.
 */
export function seedSelection(selection: NavigationData) {
    // Astro's router seeds `index`/`scrollX`/`scrollY` when its module loads; merging onto a state
    // it has not written would produce an entry its router cannot track.
    if (!inBrowser() || !history.state || readSelection()) return;
    replaceHistoryUrl(undefined, { [SELECTION_STATE_KEY]: selection });
}

export function navigateToSelection(selection: NavigationData) {
    return navigate(hrefFor(selection), { state: { [SELECTION_STATE_KEY]: selection } });
}

/**
 * Current location, tracked through every route Astro can change it by: `astro:page-load` after a
 * document swap or full load, `popstate` for back/forward, and `hashchange` for the hash-only path
 * (which Astro handles by assigning `location.href`, so no swap event fires).
 */
export function useApiReferenceLocation(): ApiReferenceLocation | null {
    const [location, setLocation] = useState(currentLocation);

    useEffect(() => {
        const update = () => {
            const next = { pathname: window.location.pathname, hash: window.location.hash };
            setLocation((prev) => (prev?.pathname === next.pathname && prev?.hash === next.hash ? prev : next));
        };

        document.addEventListener('astro:page-load', update);
        window.addEventListener('popstate', update);
        window.addEventListener('hashchange', update);

        return () => {
            document.removeEventListener('astro:page-load', update);
            window.removeEventListener('popstate', update);
            window.removeEventListener('hashchange', update);
        };
    }, []);

    return location;
}
