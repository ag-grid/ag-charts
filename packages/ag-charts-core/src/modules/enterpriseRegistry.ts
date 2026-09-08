export interface LicenseManager {
    validateLicense: () => void;
    hasLicenseKey: () => boolean;
    isDisplayWatermark: () => boolean;
    getWatermarkMessage: () => string;
    getWatermarkForegroundConfig: () => object | undefined;
    getWatermarkForegroundConfigForBrowser: () => object | undefined;
    getLicenseDetails: (licenseKey: string) => object;
}

interface EnterpriseRegistryOptions {
    styles?: string;
    licenseManager?: (document?: Document) => LicenseManager;
    injectWatermark?: (domManager: any, text: string) => void;
    createBackground?: (ctx: any) => any;
    createForeground?: (ctx: any) => any;
    createSeriesArea?: (ctx: any) => any;
    /** Theme template for the enterprise-only `seriesArea` options, merged under `seriesArea`. */
    seriesAreaThemeTemplate?: object;
}

export const enterpriseRegistry: EnterpriseRegistryOptions = {};
