import type { AgChartOptions } from 'ag-charts-types';

export interface LicenseManager {
    validateLicense: () => void;
    isDisplayWatermark: () => boolean;
    getWatermarkMessage: () => string;
    getLicenseDetails: (licenseKey: string) => object;
}

interface EnterpriseModuleOptions {
    styles?: string;
    licenseManager?: (options: AgChartOptions) => LicenseManager;
    injectWatermark?: (domManager: any, text: string) => void;
}

export const enterpriseRegistry: EnterpriseModuleOptions = {};
