import { PUBLISHED_UMD_URLS, USE_PUBLISHED_PACKAGES } from '../constants';
import { pathJoin } from './pathJoin';

export const getChartScriptPath = (sitePrefix?: string) => {
    if (USE_PUBLISHED_PACKAGES) {
        return PUBLISHED_UMD_URLS['ag-charts-community'];
    }
    const sitePrefixUrl = sitePrefix ? sitePrefix : '';
    return pathJoin(sitePrefixUrl, '/dev/ag-charts-community/dist/umd/ag-charts-community.js');
};

export const getChartEnterpriseScriptPath = (sitePrefix?: string) => {
    if (USE_PUBLISHED_PACKAGES) {
        return PUBLISHED_UMD_URLS['ag-charts-enterprise'];
    }
    const sitePrefixUrl = sitePrefix ? sitePrefix : '';
    return pathJoin(sitePrefixUrl, '/dev/ag-charts-enterprise/dist/umd/ag-charts-enterprise.js');
};

export const getChartLocaleScriptPath = (sitePrefix?: string) => {
    if (USE_PUBLISHED_PACKAGES) {
        return PUBLISHED_UMD_URLS['ag-charts-locale'];
    }
    const sitePrefixUrl = sitePrefix ? sitePrefix : '';
    return pathJoin(sitePrefixUrl, '/dev/ag-charts-locale/dist/umd/ag-charts-locale.js');
};

export const getCacheBustingUrl = (url: string, timestamp: number) => `${url}?t=${timestamp}`;
