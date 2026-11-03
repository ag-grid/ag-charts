import type { Framework } from '@ag-grid-types';
import { getFrameworkPath } from '@components/docs/utils/urlPaths';
import { FRAMEWORKS } from '@constants';

/**
 * Point a link to a framework docs page (`/charts/react/<page>/`, whatever the site's base path)
 * at `framework`'s copy of that page. Links with no framework path are returned as they came in,
 * and the base URL, any query and any hash are kept.
 */
export function hrefForFramework({ href, framework }: { href: string; framework: Framework }): string {
    const frameworkPaths = FRAMEWORKS.map(getFrameworkPath).join('|');

    return href.replace(new RegExp(`/(?:${frameworkPaths})/`), `/${getFrameworkPath(framework)}/`);
}
