export class LicenseManager {
    public validateLicense() {
        return true;
    }

    public setLicenseKey(_licenseKey: string): void {
        // No-op.
    }

    public isDisplayWatermark() {
        return false;
    }

    public getWatermarkMessage() {
        return '';
    }
}
