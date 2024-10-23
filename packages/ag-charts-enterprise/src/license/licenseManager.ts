/* eslint-disable no-nested-ternary */

/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

/* eslint-disable sonarjs/no-duplicate-string */

/* eslint-disable no-console */
import { MD5 } from './md5';

// move to general utils
function missingOrEmpty<T>(value?: T[] | string | null): value is null | undefined {
    return value == null || value.length === 0;
}

const LICENSE_TYPES = {
    '01': 'GRID',
    '02': 'CHARTS',
    '0102': 'BOTH',
};

const LICENSING_HELP_URL = 'https://ag-grid.com/charts/licensing/';

export class LicenseManager {
    private static readonly RELEASE_INFORMATION: string = 'MTcyOTY4MTExMjM1Ng==';
    private licenseKey?: string;
    private gridContext: boolean = false;
    private watermarkMessage: string | undefined = undefined;

    private readonly md5: MD5;
    private readonly document?: Document;

    private readonly totalMessageLength = 124;

    constructor(document?: Document) {
        this.document = document;

        this.md5 = new MD5();
        this.md5.init();
    }

    public validateLicense(): void {
        const licenseDetails = this.getLicenseDetails(this.licenseKey!, this.gridContext);
        const currentLicenseName = `AG ${
            licenseDetails.currentLicenseType === 'BOTH' ? 'Grid and ' : ''
        }Charts Enterprise`;

        let suppliedLicenseName = '';
        if (licenseDetails.suppliedLicenseType === 'BOTH') {
            suppliedLicenseName = 'AG Grid and AG Charts Enterprise';
        } else if (licenseDetails.suppliedLicenseType === 'GRID') {
            suppliedLicenseName = 'AG Grid Enterprise';
        } else if (licenseDetails.suppliedLicenseType !== undefined) {
            suppliedLicenseName = 'AG Charts Enterprise';
        }

        if (licenseDetails.missing) {
            if (!this.isWebsiteUrl() || this.isForceWatermark()) {
                this.outputMissingLicenseKey(currentLicenseName);
            }
        } else if (licenseDetails.expired) {
            const gridReleaseDate = LicenseManager.getChartsReleaseDate();
            const formattedReleaseDate = LicenseManager.formatDate(gridReleaseDate);
            this.outputExpiredKey(licenseDetails.expiry, formattedReleaseDate, suppliedLicenseName);
        } else if (!licenseDetails.valid) {
            this.outputInvalidLicenseKey(
                !!licenseDetails.incorrectLicenseType,
                currentLicenseName,
                suppliedLicenseName
            );
        } else if (licenseDetails.isTrial && licenseDetails.trialExpired) {
            this.outputExpiredTrialKey(licenseDetails.expiry, currentLicenseName, suppliedLicenseName);
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

        // the hash that follows the key is 32 chars long
        if (licenseKey.length <= 32) {
            return { md5: null, license: licenseKey, version: null, isTrial: null };
        }

        const hashStart = cleanedLicenseKey.length - 32;
        const md5 = cleanedLicenseKey.substring(hashStart);
        const license = cleanedLicenseKey.substring(0, hashStart);
        const [version, isTrial, type] = LicenseManager.extractBracketedInformation(cleanedLicenseKey);
        return { md5, license, version, isTrial, type };
    }

    public getLicenseDetails(licenseKey: string, gridContext = false) {
        const currentLicenseType = 'CHARTS';
        if (missingOrEmpty(licenseKey)) {
            return {
                licenseKey,
                valid: false,
                missing: true,
                currentLicenseType,
            };
        }

        const chartsReleaseDate = LicenseManager.getChartsReleaseDate();
        const { md5, license, version, isTrial, type } = LicenseManager.extractLicenseComponents(licenseKey);
        let valid = md5 === this.md5.md5(license) && licenseKey.indexOf('For_Trialing_ag-Grid_Only') === -1;
        let trialExpired: undefined | boolean = undefined;
        let expired: undefined | boolean = undefined;
        let expiry: Date | null = null;
        let incorrectLicenseType = false;
        let suppliedLicenseType: undefined | string = undefined;

        function handleTrial() {
            const now = new Date();
            trialExpired = expiry! < now;
            expired = undefined;
        }

        if (valid) {
            expiry = LicenseManager.extractExpiry(license);
            valid = !isNaN(expiry.getTime());

            if (valid) {
                expired = chartsReleaseDate > expiry;

                switch (version) {
                    case 'legacy':
                    case '2': {
                        valid = false;
                        break;
                    }
                    case '3': {
                        if (missingOrEmpty(type)) {
                            valid = false;
                        } else {
                            suppliedLicenseType = type;
                            if (type !== LICENSE_TYPES['02'] && type !== LICENSE_TYPES['0102']) {
                                valid = false;
                                incorrectLicenseType = true;
                            } else if (isTrial) {
                                handleTrial();
                            }
                        }
                    }
                }
            }
        }

        if (!valid) {
            return {
                licenseKey,
                valid,
                incorrectLicenseType,
                currentLicenseType,
                suppliedLicenseType,
            };
        }

        return {
            licenseKey,
            valid,
            expiry: LicenseManager.formatDate(expiry),
            expired,
            version,
            isTrial,
            trialExpired,
            invalidLicenseTypeForCombo: gridContext ? suppliedLicenseType !== 'BOTH' : undefined,
            incorrectLicenseType,
            currentLicenseType,
            suppliedLicenseType,
        };
    }

    public isDisplayWatermark(): boolean {
        return (
            this.isForceWatermark() ||
            (!this.isLocalhost() && !this.isWebsiteUrl() && !missingOrEmpty(this.watermarkMessage))
        );
    }

    public getWatermarkMessage(): string {
        return this.watermarkMessage ?? '';
    }

    private getHostname(): string {
        if (!this.document) {
            return 'localhost';
        }
        const win = this.document.defaultView ?? window;
        if (!win) {
            return 'localhost';
        }
        const loc = win.location;
        const { hostname = '' } = loc;

        return hostname;
    }

    private isForceWatermark(): boolean {
        if (!this.document) {
            return false;
        }
        const win = this.document?.defaultView ?? typeof window != 'undefined' ? window : undefined;
        if (!win) {
            return false;
        }

        const { pathname } = win.location;
        return pathname ? pathname.indexOf('forceWatermark') !== -1 : false;
    }

    private isWebsiteUrl(): boolean {
        const hostname = this.getHostname();
        return /^((?:[\w-]+\.)?ag-grid\.com)$/.exec(hostname) !== null;
    }

    private isLocalhost(): boolean {
        const hostname = this.getHostname();
        return /^(?:127\.0\.0\.1|localhost)$/.exec(hostname) !== null;
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

    private static getChartsReleaseDate() {
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

    public setLicenseKey(licenseKey?: string, gridContext = false): void {
        this.gridContext = gridContext;
        this.licenseKey = licenseKey;
    }

    private static extractBracketedInformation(licenseKey: string): [string | null, boolean | null, string?] {
        // legacy no trial key
        if (!licenseKey.includes('[')) {
            return ['legacy', false, undefined];
        }

        const matches = licenseKey.match(/\[(.*?)\]/g)!.map((match) => match.replace('[', '').replace(']', ''));
        if (!matches || matches.length === 0) {
            return ['legacy', false, undefined];
        }

        const isTrial = matches.filter((match) => match === 'TRIAL').length === 1;
        const rawVersion = matches.filter((match) => match.startsWith('v'))[0];
        const version = rawVersion ? rawVersion.replace('v', '') : 'legacy';
        const type = (LICENSE_TYPES as any)[matches.filter((match) => (LICENSE_TYPES as any)[match])[0]];

        return [version, isTrial, type];
    }

    private centerPadAndOutput(input: string) {
        const paddingRequired = this.totalMessageLength - input.length;
        console.error(input.padStart(paddingRequired / 2 + input.length, '*').padEnd(this.totalMessageLength, '*'));
    }

    private padAndOutput(input: string, padding = '*', terminateWithPadding = '') {
        console.error(
            input.padEnd(this.totalMessageLength - terminateWithPadding.length, padding) + terminateWithPadding
        );
    }

    private outputInvalidLicenseKey(
        incorrectLicenseType: boolean,
        currentLicenseName: string,
        suppliedLicenseName: string
    ) {
        if (!this.gridContext) {
            if (incorrectLicenseType) {
                // TC4, TC5,TC10
                this.centerPadAndOutput('');
                this.centerPadAndOutput(` ${currentLicenseName} License `);
                this.centerPadAndOutput(' Incompatible License Key ');
                this.padAndOutput(
                    `* Your license key is for ${suppliedLicenseName} only and does not cover you for ${currentLicenseName}.`,
                    ' ',
                    '*'
                );
                this.padAndOutput(`* To troubleshoot your license key visit ${LICENSING_HELP_URL}.`, ' ', '*');
                this.centerPadAndOutput('');
                this.centerPadAndOutput('');
            } else {
                // TC3, TC9
                this.centerPadAndOutput('');
                this.centerPadAndOutput(` ${currentLicenseName} License `);
                this.centerPadAndOutput(' Invalid License Key ');
                this.padAndOutput(`* Your license key is not valid.`, ' ', '*');
                this.padAndOutput(`* To troubleshoot your license key visit ${LICENSING_HELP_URL}.`, ' ', '*');
                this.centerPadAndOutput('');
                this.centerPadAndOutput('');
            }
        }

        this.watermarkMessage = 'Invalid License';
    }

    private outputExpiredTrialKey(
        formattedExpiryDate: string,
        currentLicenseName: string,
        suppliedLicenseName: string
    ) {
        if (!this.gridContext) {
            // TC14
            this.centerPadAndOutput('');
            this.centerPadAndOutput(` ${currentLicenseName} License `);
            this.centerPadAndOutput(' Trial Period Expired. ');
            this.padAndOutput(
                `* Your trial only license for ${suppliedLicenseName} expired on ${formattedExpiryDate}.`,
                ' ',
                '*'
            );
            this.padAndOutput('* Please email info@ag-grid.com to purchase a license.', ' ', '*');
            this.centerPadAndOutput('');
            this.centerPadAndOutput('');
        }

        this.watermarkMessage = 'Trial Period Expired';
    }

    private outputMissingLicenseKey(currentLicenseName: string) {
        if (!this.gridContext) {
            // TC6, TC12
            this.centerPadAndOutput('');
            this.centerPadAndOutput(` ${currentLicenseName} License `);
            this.centerPadAndOutput(' License Key Not Found ');
            this.padAndOutput(`* All ${currentLicenseName} features are unlocked for trial.`, ' ', '*');
            this.padAndOutput(
                '* If you want to hide the watermark please email info@ag-grid.com for a trial license key.',
                ' ',
                '*'
            );
            this.centerPadAndOutput('');
            this.centerPadAndOutput('');
        }

        this.watermarkMessage = 'For Trial Use Only';
    }

    private outputExpiredKey(formattedExpiryDate: string, formattedReleaseDate: string, currentLicenseName: string) {
        // TC2
        if (!this.gridContext) {
            this.centerPadAndOutput('');
            this.centerPadAndOutput(` ${currentLicenseName} License `);
            this.centerPadAndOutput(' Incompatible Software Version ');
            this.padAndOutput(
                `* Your license key works with versions of ${currentLicenseName} released before ${formattedExpiryDate}.`,
                ' ',
                '*'
            );
            this.padAndOutput(`* The version you are trying to use was released on ${formattedReleaseDate}.`, ' ', '*');
            this.padAndOutput('* Please contact info@ag-grid.com to renew your license key.', ' ', '*');
            this.centerPadAndOutput('');
            this.centerPadAndOutput('');
        }

        this.watermarkMessage = 'License Expired';
    }
}
