export class LicenseManager {
    public validateLicense() {
        return true;
    }

    public static setLicenseKey(_licenseKey: string): void {
        // No-op.
    }

    public static setGridContext(): void {
        // No-op.
    }

    public isDisplayWatermark() {
        return false;
    }

    public getWatermarkMessage() {
        return '';
    }

    public getWatermarkForegroundConfig() {
        return undefined;
    }

    public getWatermarkForegroundConfigForBrowser() {
        return undefined;
    }
}
