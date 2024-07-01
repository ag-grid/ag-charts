import type { AgChartOptions } from 'ag-charts-types';
import type { DOMManager } from '../chart/dom/domManager';
export interface LicenseManager {
    setLicenseKey: (key?: string, gridContext?: boolean) => void;
    validateLicense: () => void;
    isDisplayWatermark: () => boolean;
    getWatermarkMessage: () => string;
    getLicenseDetails: (licenseKey: string) => {};
}
interface EnterpriseModuleOptions {
    isEnterprise: boolean;
    licenseManager?: (options: AgChartOptions) => LicenseManager;
    injectWatermark?: (domManager: DOMManager, text: string) => void;
}
export declare const enterpriseModule: EnterpriseModuleOptions;
export {};
