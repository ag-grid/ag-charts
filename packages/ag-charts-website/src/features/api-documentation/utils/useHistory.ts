import type { Location } from 'history';
import { createBrowserHistory } from 'history';
import { useEffect, useState } from 'react';

const browserHistory = import.meta.env.SSR ? null : createBrowserHistory();

export function useLocation() {
    const [location, setLocation] = useState<Location | null>(browserHistory?.location ?? null);
    useEffect(() => browserHistory?.listen(({ location }) => setLocation(location)), []);
    return location;
}
