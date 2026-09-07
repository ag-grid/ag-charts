import type { AgChartOptions } from 'ag-charts-types';

export interface LicenseManager {
    validateLicense: () => void;
    isDisplayWatermark: () => boolean;
    getWatermarkMessage: () => string;
    getWatermarkForegroundConfig: () => object | undefined;
    getWatermarkForegroundConfigForBrowser: () => object | undefined;
    getLicenseDetails: (licenseKey: string) => object;
}

interface EnterpriseRegistryOptions {
    styles?: string;
    licenseManager?: (options: AgChartOptions) => LicenseManager;
    injectWatermark?: (domManager: any, text: string) => void;
    createBackground?: (ctx: any) => any;
    createForeground?: (ctx: any) => any;
    createSeriesArea?: (ctx: any) => any;
    /** Theme template for the enterprise-only `seriesArea` options, merged under `seriesArea`. */
    seriesAreaThemeTemplate?: object;
}

export const enterpriseRegistry: EnterpriseRegistryOptions = {};
