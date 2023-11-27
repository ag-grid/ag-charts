import type { Framework, InternalFramework } from './types/ag-grid';

export const FRAMEWORKS: readonly Framework[] = ['react', 'angular', 'vue', 'javascript'] as const;
export const DEFAULT_FRAMEWORK: Framework = FRAMEWORKS[0];

export const INTERNAL_FRAMEWORKS: readonly InternalFramework[] = [
    'vanilla',
    'typescript',
    'reactFunctional',
    'reactFunctionalTs',
    'angular',
    'vue',
    'vue3',
] as const;

export const TYPESCRIPT_INTERNAL_FRAMEWORKS: InternalFramework[] = ['typescript', 'reactFunctionalTs', 'angular'];

export const FRAMEWORK_DISPLAY_TEXT: Record<Framework, string> = {
    javascript: 'JavaScript',
    react: 'React',
    angular: 'Angular',
    vue: 'Vue',
};

export const agChartsVersion = import.meta.env?.PUBLIC_PACKAGE_VERSION ?? 'unknown';
export const agChartsReactVersion = import.meta.env?.PUBLIC_PACKAGE_VERSION ?? 'unknown';
export const agChartsAngularVersion = import.meta.env?.PUBLIC_PACKAGE_VERSION ?? 'unknown';
export const agChartsVueVersion = import.meta.env?.PUBLIC_PACKAGE_VERSION ?? 'unknown';

export const DOCS_TAB_ITEM_ID_PREFIX = 'reference-';

/**
 * Site base URL
 *
 * ie undefined for dev, /ag-charts for staging
 *
 * NOTE: Includes trailing slash (`/`)
 */
export const SITE_BASE_URL =
    // Astro default env var (for build time)
    import.meta.env?.BASE_URL ||
    // `.env.*` override (for client side)
    import.meta.env?.PUBLIC_BASE_URL.replace(/\/?$/, '/');

/*
 * Site URL
 *
 * ie http://localhost:4600 for dev, https://charts-staging.ag-grid.com for staging
 */
export const SITE_URL = import.meta.env?.SITE_URL || import.meta.env?.PUBLIC_SITE_URL;

export const STAGING_SITE_URL = 'https://charts-staging.ag-grid.com';
export const PRODUCTION_SITE_URL = 'https://charts.ag-grid.com';
export const USE_PUBLISHED_PACKAGES = ['1', 'true'].includes(import.meta.env?.PUBLIC_USE_PUBLISHED_PACKAGES);

/**
 * Number of URL segments in `SITE_BASE_URL`
 */
export const SITE_BASE_URL_SEGMENTS = SITE_BASE_URL?.split('/').filter(Boolean).length || 0;

/**
 * URL prefix to serve files for dev server
 */
export const DEV_FILE_BASE_PATH = '/dev';

export const ASTRO_ALGOLIA_APP_ID = import.meta.env?.PUBLIC_ASTRO_ALGOLIA_APP_ID;

export const ASTRO_ALGOLIA_SEARCH_KEY = import.meta.env?.PUBLIC_ASTRO_ALGOLIA_SEARCH_KEY;

export const GRID_URL = SITE_URL
    ? SITE_URL.includes('localhost:4600')
        ? 'https://localhost:8000'
        : SITE_URL.includes(STAGING_SITE_URL)
        ? 'https://build.ag-grid.com'
        : 'https://ag-grid.com'
    : undefined;
