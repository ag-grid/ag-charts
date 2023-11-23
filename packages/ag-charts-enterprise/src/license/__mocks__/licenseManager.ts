export class LicenseManager {
    constructor() {}

    public validateLicense() {
        return true;
    }

    public setLicenseKey(_licenseKey: string): void {}

    public isDisplayWatermark() {
        return false;
    }

    public getWatermarkMessage() {
        return '';
    }
}
