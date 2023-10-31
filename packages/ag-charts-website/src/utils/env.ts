export const getIsDev = () => import.meta.env?.DEV;
export const getIsStaging = () => import.meta.env?.PUBLIC_SITE_URL === 'https://testing.ag-grid.com';
