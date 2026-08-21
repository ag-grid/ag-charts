import { ThemeBuilder } from '@ag-website-shared/components/theme-builder-charts/ThemeBuilder';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useStore } from '@nanostores/react';
import { $darkmode } from '@stores/darkmodeStore';
import { useMemo } from 'react';

/**
 * AG Charts host for the shared theme builder. The shared layer owns the model
 * and the editors; the host owns only the site's dark-mode convention and the
 * Emotion cache.
 */
export function ThemeBuilderShared() {
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
