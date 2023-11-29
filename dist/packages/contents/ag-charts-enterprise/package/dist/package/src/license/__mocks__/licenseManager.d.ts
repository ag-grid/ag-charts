export declare class LicenseManager {
    constructor();
    validateLicense(): boolean;
    setLicenseKey(_licenseKey: string): void;
    isDisplayWatermark(): boolean;
    getWatermarkMessage(): string;
}
