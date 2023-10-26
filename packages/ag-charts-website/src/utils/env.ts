export const getIsDev = () => import.meta.env?.DEV;
export const getIsStaging = () => import.meta.env?.SITE_URL === 'https://testing.ag-grid.com';
