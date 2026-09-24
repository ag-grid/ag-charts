import { LicenseManager } from '../licenseManager';

type LicenseManagerStatics = {
    licenseKey?: string;
    licenseKeySupplied: boolean;
    licenseOutputLogged: boolean;
};

// The key is process-wide static state, and `setLicenseKey()` can only ever mark it as supplied, so tests
// need a way back to the never-supplied state without widening the manager's API.
export function clearLicenseKey(): void {
    const statics = LicenseManager as unknown as LicenseManagerStatics;
    statics.licenseKey = undefined;
    statics.licenseKeySupplied = false;
    statics.licenseOutputLogged = false;
}
