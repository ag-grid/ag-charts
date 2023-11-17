import { pathJoin } from './pathJoin';

export const getChartScriptPath = (sitePrefix?: string) => {
    const sitePrefixUrl = sitePrefix ? sitePrefix : '';
    return pathJoin(sitePrefixUrl, '/dev/ag-charts-community/dist/umd/ag-charts-community.js');
};

export const getChartEnterpriseScriptPath = (sitePrefix?: string) => {
    const sitePrefixUrl = sitePrefix ? sitePrefix : '';
    return pathJoin(sitePrefixUrl, '/dev/ag-charts-enterprise/dist/umd/ag-charts-enterprise.js');
};

export const getCacheBustingUrl = (url: string, timestamp: number) => `${url}?t=${timestamp}`;
