import type { Framework, InternalFramework } from './types/ag-grid';

export const FRAMEWORKS: readonly Framework[] = ['javascript', 'react', 'angular', 'vue'] as const;

export const INTERNAL_FRAMEWORKS: readonly InternalFramework[] = [
    'vanilla',
    'typescript',
    'react',
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

export const agGridVersion = '30.0.0';
export const agGridEnterpriseVersion = '30.0.0';
export const agGridReactVersion = '30.0.0';
export const agGridAngularVersion = '30.0.0';
export const agGridVueVersion = '30.0.0';
export const agGridVue3Version = '30.0.0';

export const agChartsVersion = '8.0.0';
export const agChartsReactVersion = '8.0.0';
export const agChartsAngularVersion = '8.0.0';
export const agChartsVueVersion = '8.0.0';

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
 * ie http://localhost:4600 for dev, https://testing.ag-grid.com for staging
 */
export const SITE_URL = import.meta.env?.SITE_URL || import.meta.env?.PUBLIC_SITE_URL;

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
