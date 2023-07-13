import type { Framework, InternalFramework } from './types/ag-grid';

export const FRAMEWORKS: Framework[] = ['javascript', 'react', 'angular', 'vue'];

export const INTERNAL_FRAMEWORKS: InternalFramework[] = [
    'vanilla',
    'typescript',
    'react',
    'reactFunctional',
    'reactFunctionalTs',
    'angular',
    'vue',
    'vue3',
];

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

/**
 * Site base URL
 *
 * NOTE: Includes trailing slash (`/`)
 */
export const SITE_BASE_URL = import.meta.env.BASE_URL;

/**
 * URL prefix to serve files for dev server
 */
export const localPrefix = `${SITE_BASE_URL}dev`;

const siteBaseUrlSegments = SITE_BASE_URL.split('/').filter(Boolean).length;
export const FRAMEWORK_PATH_INDEX = 1 + siteBaseUrlSegments;
export const PAGE_NAME_PATH_INDEX = 2 + siteBaseUrlSegments;
