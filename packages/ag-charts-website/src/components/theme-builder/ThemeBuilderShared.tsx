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
 * What each theme param does, keyed by name, for the editors' tooltips. Held in
 * a module variable because the shared model reads descriptions through a
 * registry, and a provider closing over a prop would re-register every render.
 */
let siteParamDocs: Record<string, string> = {};

setParamDocsProvider((property) => siteParamDocs[property]);

/**
 * A param's row in the Themes API reference, which the page expands and scrolls
 * to on a matching hash. The shape is `anchorId`'s, from `ApiReference.tsx`.
 * Linked only where a description was found, a param the reference does not
 * carry having no row to anchor on.
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
