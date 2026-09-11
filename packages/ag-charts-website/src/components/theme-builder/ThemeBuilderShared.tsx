import { ThemeBuilder } from '@ag-website-shared/components/theme-builder-charts/ThemeBuilder';
import { setParamDocsProvider, setParamDocsUrlProvider } from '@ag-website-shared/theming/ParamModel';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useStore } from '@nanostores/react';
import { $darkmode } from '@stores/darkmodeStore';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { useMemo } from 'react';

/**
 * AG Charts host for the shared theme builder. The shared layer owns the model
 * and the editors; the host owns only the site's dark-mode convention, the
 * Emotion cache, and the param descriptions the site extracts at build time.
 */

/**
 * What each theme param does, keyed by name, for the editors' tooltips.
 *
 * Held here rather than passed down because the shared model reads descriptions
 * through a registry, and registering a provider that closes over a prop would
 * mean re-registering on every render. Docs are read on demand, so the value
 * only has to be in place before an editor renders - which it is, this being
 * their parent.
 */
let siteParamDocs: Record<string, string> = {};

setParamDocsProvider((property) => siteParamDocs[property]);

/**
 * A param's row in the Themes API reference, which the page expands and scrolls
 * to on a matching hash.
 *
 * The shape is the reference's own, from `anchorId` in `ApiReference.tsx`:
 * `reference-<root interface>-<member>`, then a segment per level below it. The
 * docs pages write these by hand too - `/themes-api/#reference-AgChartTheme-params`
 * in the themes page - so this follows the site's convention rather than
 * introducing one.
 *
 * Linked only for the params the reference is known to carry - the descriptions
 * are read from it, so a param with one has a row to anchor on. A param without
 * would otherwise get a link to a hash that exists nowhere on the page, which
 * loads the reference and quietly leaves the reader at the top of it.
 */
const paramAnchor = (property: string) => `reference-AgChartTheme-params-${property}`;

setParamDocsUrlProvider((property) =>
    siteParamDocs[property] ? `${urlWithBaseUrl('/themes-api/')}#${paramAnchor(property)}` : undefined
);

export function ThemeBuilderShared({ paramDocs }: { paramDocs: Record<string, string> }) {
    siteParamDocs = paramDocs;

    const isDark = useStore($darkmode) === true;

    // A head swap removes Emotion's <style> elements while its module-level cache still
    // considers them inserted, so each mount needs its own cache.
    const emotionCache = useMemo(() => createCache({ key: 'tb' }), []);

    return (
        <CacheProvider value={emotionCache}>
            <ThemeBuilder isDark={isDark} />
        </CacheProvider>
    );
}
