/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable no-console */
import { MD5 } from './md5';

// move to general utils
function missingOrEmpty<T>(value?: T[] | string | null): boolean {
    return value == null || value.length === 0;
}

function exists(value: any, allowEmptyString = false): boolean {
    return value != null && (value !== '' || allowEmptyString);
}

export class LicenseManager {
    private static RELEASE_INFORMATION: string = 'MTY4OTUzMzE0MDAzNw==';
    private static licenseKey: string;
    private watermarkMessage: string | undefined = undefined;

    private md5: MD5;
    private document: Document;

    constructor(document: Document) {
        this.document = document;

        this.md5 = new MD5();
        this.md5.init();
    }

    public validateLicense(): void {
        if (missingOrEmpty(LicenseManager.licenseKey)) {
            if (!this.isWebsiteUrl() || this.isForceWatermark()) {
                this.outputMissingLicenseKey();
            }
        } else if (LicenseManager.licenseKey.length > 32) {
            if (LicenseManager.licenseKey.indexOf('For_Trialing_ag-Grid_Only') !== -1) {
                this.outputInvalidLicenseKey();
            } else {
                const { md5, license, version, isTrial } = LicenseManager.extractLicenseComponents(
                    LicenseManager.licenseKey
                );

                if (md5 === this.md5.md5(license)) {
                    if (exists(version) && version) {
                        this.validateLicenseKeyForVersion(version, !!isTrial, license);
                    } else {
                        this.validateLegacyKey(license);
                    }
                } else {
                    this.outputInvalidLicenseKey();
                }
            }
        } else {
            this.outputInvalidLicenseKey();
        }
    }

    private static extractExpiry(license: string) {
        const restrictionHashed = license.substring(license.lastIndexOf('_') + 1, license.length);
        return new Date(parseInt(LicenseManager.decode(restrictionHashed), 10));
    }

    private static extractLicenseComponents(licenseKey: string) {
        // when users copy the license key from a PDF extra zero width characters are sometimes copied too
        // carriage returns and line feeds are problematic too
        // all of which causes license key validation to fail - strip these out
        let cleanedLicenseKey = licenseKey.replace(/[\u200B-\u200D\uFEFF]/g, '');
        cleanedLicenseKey = cleanedLicenseKey.replace(/\r?\n|\r/g, '');

        const hashStart = cleanedLicenseKey.length - 32;
        const md5 = cleanedLicenseKey.substring(hashStart);
        const license = cleanedLicenseKey.substring(0, hashStart);
        const [version, isTrial] = LicenseManager.extractBracketedInformation(cleanedLicenseKey);
        return { md5, license, version, isTrial };
    }

    public getLicenseDetails(licenseKey: string) {
        const { md5, license, version, isTrial } = LicenseManager.extractLicenseComponents(licenseKey);
        let valid = md5 === this.md5.md5(license) && licenseKey.indexOf('For_Trialing_ag-Grid_Only') === -1;
        let trialExpired: null | boolean = null;

        let expiry: Date | null = null;
        if (valid) {
            expiry = LicenseManager.extractExpiry(license);
            valid = !isNaN(expiry.getTime());

            if (isTrial) {
                const now = new Date();
                trialExpired = expiry < now;
            }
        }

        return {
            licenseKey,
            valid,
            expiry: valid ? LicenseManager.formatDate(expiry) : null,
            version: version ? version : 'legacy',
            isTrial,
            trialExpired,
        };
    }

    public isDisplayWatermark(): boolean {
        return (
            this.isForceWatermark() ||
            (!this.isLocalhost() && !this.isWebsiteUrl() && !missingOrEmpty(this.watermarkMessage))
        );
    }

    public getWatermarkMessage(): string {
        return this.watermarkMessage || '';
    }

    private getHostname(): string {
        const win = this.document.defaultView || window;
        const loc = win.location;
        const { hostname = '' } = loc;

        return hostname;
    }

    private isForceWatermark(): boolean {
        const win = this.document.defaultView || window;
        const loc = win.location;
        const { pathname } = loc;

        return pathname ? pathname.indexOf('forceWatermark') !== -1 : false;
    }

    private isWebsiteUrl(): boolean {
        const hostname = this.getHostname();
        return hostname.match(/^((?:\w+\.)?ag-grid\.com)$/) !== null;
    }

    private isLocalhost(): boolean {
        const hostname = this.getHostname();
        return hostname.match(/^(?:127\.0\.0\.1|localhost)$/) !== null;
    }

    private static formatDate(date: any): string {
        const monthNames: string[] = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];

        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();

        return day + ' ' + monthNames[monthIndex] + ' ' + year;
    }

    private static getGridReleaseDate() {
        return new Date(parseInt(LicenseManager.decode(LicenseManager.RELEASE_INFORMATION), 10));
    }

    private static decode(input: string): string {
        const keystr: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let t = '';
        let n: any, r: any, i: any;
        let s: any, o: any, u: any, a: any;
        let f: number = 0;
        const e: string = input.replace(/[^A-Za-z0-9+/=]/g, '');
        while (f < e.length) {
            s = keystr.indexOf(e.charAt(f++));
            o = keystr.indexOf(e.charAt(f++));
            u = keystr.indexOf(e.charAt(f++));
            a = keystr.indexOf(e.charAt(f++));
            n = (s << 2) | (o >> 4);
            r = ((o & 15) << 4) | (u >> 2);
            i = ((u & 3) << 6) | a;
            t = t + String.fromCharCode(n);
            if (u != 64) {
                t = t + String.fromCharCode(r);
            }
            if (a != 64) {
                t = t + String.fromCharCode(i);
            }
        }
        t = LicenseManager.utf8_decode(t);
        return t;
    }

    private static utf8_decode(input: string): string {
        input = input.replace(/rn/g, 'n');
        let t = '';
        for (let n = 0; n < input.length; n++) {
            const r = input.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
            } else if (r > 127 && r < 2048) {
                t += String.fromCharCode((r >> 6) | 192);
                t += String.fromCharCode((r & 63) | 128);
            } else {
                t += String.fromCharCode((r >> 12) | 224);
                t += String.fromCharCode(((r >> 6) & 63) | 128);
                t += String.fromCharCode((r & 63) | 128);
            }
        }
        return t;
    }

    static setLicenseKey(licenseKey: string): void {
        this.licenseKey = licenseKey;
    }

    private static extractBracketedInformation(licenseKey: string): [string | null, boolean | null] {
        const matches = licenseKey
            .split('[')
            .filter(function (v) {
                return v.indexOf(']') > -1;
            })
            .map(function (value) {
                return value.split(']')[0];
            });

        if (!matches || matches.length === 0) {
            return [null, null];
        }

        const isTrial = matches.filter((match) => match === 'TRIAL').length === 1;
        const version = matches.filter((match) => match.indexOf('v') === 0).map((match) => match.replace(/^v/, ''))[0];

        return [version, isTrial];
    }

    private validateLicenseKeyForVersion(version: string, isTrial: boolean, license: string) {
        if (version !== '2') {
            return;
        }

        if (isTrial) {
            this.validateForTrial(license);
        } else {
            this.validateLegacyKey(license);
        }
    }

    private validateLegacyKey(license: string) {
        const gridReleaseDate = LicenseManager.getGridReleaseDate();
        const expiry = LicenseManager.extractExpiry(license);

        let valid: boolean = false;
        let current: boolean = false;
        if (!isNaN(expiry.getTime())) {
            valid = true;
            current = gridReleaseDate < expiry;
        }

        if (!valid) {
            this.outputInvalidLicenseKey();
        } else if (!current) {
            const formattedExpiryDate = LicenseManager.formatDate(expiry);
            const formattedReleaseDate = LicenseManager.formatDate(gridReleaseDate);

            this.outputIncompatibleVersion(formattedExpiryDate, formattedReleaseDate);
        }
    }

    private validateForTrial(license: string) {
        const expiry = LicenseManager.extractExpiry(license);
        const now = new Date();

        let valid: boolean = false;
        let current: boolean = false;
        if (!isNaN(expiry.getTime())) {
            valid = true;
            current = expiry > now;
        }

        if (!valid) {
            this.outputInvalidLicenseKey();
        } else if (!current) {
            const formattedExpiryDate = LicenseManager.formatDate(expiry);
            this.outputExpiredTrialKey(formattedExpiryDate);
        }
    }

    private outputInvalidLicenseKey() {
        console.error(
            '******************************************************************************************************************'
        );
        console.error(
            '***************************************** AG Charts Enterprise License ********************************************'
        );
        console.error(
            '********************************************** Invalid License ****************************************************'
        );
        console.error(
            '* Your license for AG Charts Enterprise is not valid - please contact info@ag-grid.com to obtain a valid license. *'
        );
        console.error(
            '*******************************************************************************************************************'
        );
        console.error(
            '*******************************************************************************************************************'
        );

        this.watermarkMessage = 'Invalid License';
    }

    private outputExpiredTrialKey(formattedExpiryDate: string) {
        console.error(
            '****************************************************************************************************************'
        );
        console.error(
            '***************************************** AG Charts Enterprise License *******************************************'
        );
        console.error(
            '*****************************************   Trial Period Expired.    *******************************************'
        );
        console.error(
            `* Your license for AG Charts Enterprise expired on ${formattedExpiryDate}.                                                *`
        );
        console.error(
            '* Please email info@ag-grid.com to purchase a license.                                                         *'
        );
        console.error(
            '****************************************************************************************************************'
        );
        console.error(
            '****************************************************************************************************************'
        );

        this.watermarkMessage = 'Trial Period Expired';
    }

    private outputMissingLicenseKey() {
        console.error(
            '****************************************************************************************************************'
        );
        console.error(
            '***************************************** AG Charts Enterprise License *******************************************'
        );
        console.error(
            '****************************************** License Key Not Found ***********************************************'
        );
        console.error(
            '* All AG Charts Enterprise features are unlocked.                                                                *'
        );
        console.error(
            '* This is an evaluation only version, it is not licensed for development projects intended for production.     *'
        );
        console.error(
            '* If you want to hide the watermark, please email info@ag-grid.com for a trial license.                        *'
        );
        console.error(
            '****************************************************************************************************************'
        );
        console.error(
            '****************************************************************************************************************'
        );

        this.watermarkMessage = 'For Trial Use Only';
    }

    private outputIncompatibleVersion(formattedExpiryDate: string, formattedReleaseDate: string) {
        console.error(
            '****************************************************************************************************************************'
        );
        console.error(
            '****************************************************************************************************************************'
        );
        console.error(
            '*                                             AG Charts Enterprise License                                                   *'
        );
        console.error(
            '*                           License not compatible with installed version of AG Charts Enterprise.                           *'
        );
        console.error(
            '*                                                                                                                          *'
        );
        console.error(
            `* Your AG Charts License entitles you to all versions of AG Charts that we release within the time covered by your license     *`
        );
        console.error(
            `* - typically we provide one year licenses which entitles you to all releases / updates of AG Charts within that year.       *`
        );
        console.error(
            `* Your license has an end (expiry) date which stops the license key working with versions of AG Charts released after the    *`
        );
        console.error(
            `* license end date. The license key that you have expires on ${formattedExpiryDate}, however the version of AG Charts you    *`
        );
        console.error(
            `* are trying to use was released on ${formattedReleaseDate}.                                                               *`
        );
        console.error(
            '*                                                                                                                          *'
        );
        console.error(
            '* Please contact info@ag-grid.com to renew your subscription to new versions and get a new license key to work with this   *'
        );
        console.error(
            '* version of AG Charts.                                                                                                      *'
        );
        console.error(
            '****************************************************************************************************************************'
        );
        console.error(
            '****************************************************************************************************************************'
        );

        this.watermarkMessage = 'License Expired';
    }
}
