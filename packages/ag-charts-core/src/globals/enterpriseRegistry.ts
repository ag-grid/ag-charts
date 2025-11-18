import type { AgChartOptions } from 'ag-charts-types';

export interface LicenseManager {
    validateLicense: () => void;
    isDisplayWatermark: () => boolean;
    getWatermarkMessage: () => string;
    getLicenseDetails: (licenseKey: string) => object;
}

interface EnterpriseRegistryOptions {
    styles?: string;
    licenseManager?: (options: AgChartOptions) => LicenseManager;
    injectWatermark?: (domManager: any, text: string) => void;
    createBackground?: (ctx: any) => any;
    createForeground?: (ctx: any) => any;
}

export const enterpriseRegistry: EnterpriseRegistryOptions = {};
