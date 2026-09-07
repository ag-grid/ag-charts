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
}

export const enterpriseRegistry: EnterpriseRegistryOptions = {};
