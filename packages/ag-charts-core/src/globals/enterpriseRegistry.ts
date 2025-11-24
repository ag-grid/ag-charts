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
    isRegistered(): boolean;
}

export const enterpriseRegistry: EnterpriseRegistryOptions = {
    isRegistered() {
        // has siblings apart from the isRegistered method
        return Object.keys(this).length > 1;
    },
};
