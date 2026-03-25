/* eslint-disable no-console */
import { MD5 } from './md5';

// move to general utils
function missingOrEmpty<T>(value?: T[] | string | null): value is null | undefined {
    return value == null || value.length === 0;
}

const WATERMARK_SVG_DATA_URL = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU4IiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMjU4IDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMjUuNzc5IDI4LjY1N0gxMy4zNTlMMTEuMTczIDM0LjAxMkg1LjY3Mjk3TDE3LjE4MiA3LjA1OTk5SDIxLjk1M0wzMy40NjIgMzQuMDEySDI3Ljk2MkwyNS43NzYgMjguNjU3SDI1Ljc3OVpNMjQuMDY4IDI0LjM5N0wxOS41ODggMTMuNDM0TDE1LjEwNyAyNC4zOTdIMjQuMDY4Wk02Mi4wOTIgMTguODIzSDQ5LjgxN1YyMy4wODZINTYuNzc1QzU2LjU1NSAyNS4yMjIgNTUuNzU1IDI2LjkyNyA1NC4zNzIgMjguMjAyQzUyLjk4OSAyOS40NzYgNTEuMTY2IDMwLjExNSA0OC45MDkgMzAuMTE1QzQ3LjYyMiAzMC4xMTUgNDYuNDUgMjkuODg1IDQ1LjM5MyAyOS40MjNDNDQuMzU4MyAyOC45NzgxIDQzLjQzMjYgMjguMzEzOCA0Mi42OCAyNy40NzZDNDEuOTI3IDI2LjYzOSA0MS4zNDQgMjUuNjMxIDQwLjkzMSAyNC40NTNDNDAuNTE5IDIzLjI3NSA0MC4zMTEgMjEuOTcgNDAuMzExIDIwLjUzN0M0MC4zMTEgMTkuMTA1IDQwLjUxNiAxNy44IDQwLjkzMSAxNi42MjFDNDEuMzQ0IDE1LjQ0MyA0MS45MjcgMTQuNDM2IDQyLjY4IDEzLjU5OEM0My40Mzc2IDEyLjc1NzcgNDQuMzY5NiAxMi4wOTMyIDQ1LjQxMSAxMS42NTFDNDYuNDc4IDExLjE4OSA0Ny42NTYgMTAuOTYgNDguOTQ2IDEwLjk2QzUxLjYxMiAxMC45NiA1My42MzcgMTEuNjAyIDU1LjAyIDEyLjg4NUw1OC4zIDkuNjA0OTlDNTUuODE3IDcuNjY5OTkgNTIuNjc2IDYuNjk5OTkgNDguODcyIDYuNjk5OTlDNDYuNzYgNi42OTk5OSA0NC44NTMgNy4wMzQ5OSA0My4xNTQgNy43MDA5OUM0MS40NTUgOC4zNjc5OSAzOS45OTggOS4zMDM5OSAzOC43ODMgMTAuNTA0QzM3LjU2NyAxMS43MDcgMzYuNjM0IDEzLjE1OCAzNS45NzcgMTQuODU3QzM1LjMxOSAxNi41NTYgMzQuOTk0IDE4LjQ1MSAzNC45OTQgMjAuNTRDMzQuOTk0IDIyLjYzIDM1LjMyOSAyNC40OTQgMzUuOTk1IDI2LjIwNUMzNi42NjIgMjcuOTE2IDM3LjYwNSAyOS4zNzQgMzguODE3IDMwLjU3N0M0MC4wMzIgMzEuNzggNDEuNDg2IDMyLjcxMyA0My4xODggMzMuMzgzQzQ0Ljg4OCAzNC4wNDkgNDYuNzgyIDM0LjM4NCA0OC44NzIgMzQuMzg0QzUwLjk2MSAzNC4zODQgNTIuNzUgMzQuMDQ5IDU0LjM5IDMzLjM4M0M1Ni4wMzEgMzIuNzE2IDU3LjQyNiAzMS43OCA1OC41NzkgMzAuNTc3QzU5LjczMyAyOS4zNzQgNjAuNjE5IDI3LjkxNiA2MS4yMzkgMjYuMjA1QzYxLjg2IDI0LjQ5NCA2Mi4xNyAyMi42MDUgNjIuMTcgMjAuNTRDNjIuMTY5NiAxOS45Njg4IDYyLjE0NDUgMTkuMzk4IDYyLjA5NSAxOC44MjlMNjIuMDkyIDE4LjgyM1pNMTUxLjgxIDE2Ljk4MUMxNTMuNDEgMTQuNjA5IDE1Ny40MTkgMTQuMzU4IDE1OS4wMjIgMTQuMzU4VjE4LjkxQzE1Ni45NTcgMTguOTEgMTU0Ljk4NSAxOC45OTYgMTUzLjc1NyAxOS44OTJDMTUyLjUyOSAyMC43OTIgMTUxLjkxOSAyMS45ODIgMTUxLjkxOSAyMy40NjRWMzMuOTlIMTQ2Ljk2NFYxNC4zNThIMTUxLjczNkwxNTEuODEgMTYuOTgxWk0xNDMuMDExIDE0LjM2MVYzNC4wMzFIMTM4LjI0TDEzOC4xMzEgMzEuMDQ1QzEzNy40NjYgMzIuMDc2IDEzNi41NTEgMzIuOTIxOSAxMzUuNDcxIDMzLjUwNEMxMzQuMzc2IDM0LjA5OSAxMzMuMDY4IDM0LjM5NiAxMzEuNTM2IDM0LjM5NkMxMzAuMiAzNC4zOTYgMTI4Ljk2MyAzNC4xNTIgMTI3LjgyMiAzMy42NjhDMTI2LjcgMzMuMTk2NCAxMjUuNjg5IDMyLjQ5NSAxMjQuODU1IDMxLjYwOUMxMjQuMDE4IDMwLjcyMiAxMjMuMzU0IDI5LjY2MiAxMjIuODcxIDI4LjQyMkMxMjIuMzg0IDI3LjE4NSAxMjIuMTQyIDI1LjgxMSAxMjIuMTQyIDI0LjMwNEMxMjIuMTQyIDIyLjc5OCAxMjIuMzg0IDIxLjM3OCAxMjIuODcxIDIwLjExNkMxMjMuMzU3IDE4Ljg1NCAxMjQuMDE4IDE3Ljc3MiAxMjQuODU1IDE2Ljg3M0MxMjUuNjg4IDE1Ljk3NjQgMTI2LjY5OCAxNS4yNjM2IDEyNy44MjIgMTQuNzhDMTI4Ljk2MyAxNC4yODEgMTMwLjIwMyAxNC4wMzMgMTMxLjUzNiAxNC4wMzNDMTMzLjA0MyAxNC4wMzMgMTM0LjMzIDE0LjMxOCAxMzUuMzk3IDE0Ljg4OEMxMzYuNDYyIDE1LjQ1ODkgMTM3LjM3NSAxNi4yNzggMTM4LjA1NyAxNy4yNzZWMTQuMzYxSDE0My4wMTFaTTEzMi42MzEgMzAuMTMzQzEzNC4yNTYgMzAuMTMzIDEzNS41NjcgMjkuNTk0IDEzNi41NjUgMjguNTEyQzEzNy41NjEgMjcuNDMgMTM4LjA2IDI1Ljk5MSAxMzguMDYgMjQuMTk2QzEzOC4wNiAyMi40MDEgMTM3LjU2MSAyMC45OSAxMzYuNTY1IDE5Ljg5OUMxMzUuNTcgMTguODA3IDEzNC4yNTkgMTguMjU4IDEzMi42MzEgMTguMjU4QzEzMS4wMDMgMTguMjU4IDEyOS43MjkgMTguODA0IDEyOC43MzQgMTkuODk5QzEyNy43MzggMjAuOTkzIDEyNy4yMzkgMjIuNDM4IDEyNy4yMzkgMjQuMjMzQzEyNy4yMzkgMjYuMDI4IDEyNy43MzUgMjcuNDMzIDEyOC43MzQgMjguNTE1QzEyOS43MjkgMjkuNTk0IDEzMS4wMjggMzAuMTM2IDEzMi42MzEgMzAuMTM2VjMwLjEzM1pNOTMuNjk4IDI3Ljg3NkM5My41Nzk1IDI4LjAwMjUgOTMuNDU2NCAyOC4xMjQ2IDkzLjMyOSAyOC4yNDJDOTEuOTQ3IDI5LjUxNiA5MC4xMjMgMzAuMTU1IDg3Ljg2NiAzMC4xNTVDODYuNTggMzAuMTU1IDg1LjQwOCAyOS45MjYgODQuMzUgMjkuNDY0QzgzLjMxNTUgMjkuMDE4OSA4Mi4zODk4IDI4LjM1NDYgODEuNjM3IDI3LjUxN0M4MC44ODQgMjYuNjc5IDgwLjMwMSAyNS42NzIgNzkuODg5IDI0LjQ5NEM3OS40NzYgMjMuMzE1IDc5LjI2OSAyMi4wMSA3OS4yNjkgMjAuNTc4Qzc5LjI2OSAxOS4xNDUgNzkuNDczIDE3Ljg0IDc5Ljg4OSAxNi42NjJDODAuMzAxIDE1LjQ4NCA4MC44ODQgMTQuNDc2IDgxLjYzNyAxMy42MzlDODIuMzk0OSAxMi43OTg3IDgzLjMyNzMgMTIuMTM0MiA4NC4zNjkgMTEuNjkyQzg1LjQzNiAxMS4yMyA4Ni42MTQgMTEgODcuOTAzIDExQzkwLjU3IDExIDkyLjU5NSAxMS42NDIgOTMuOTc3IDEyLjkyNkw5Ny4yNTggOS42NDQ5OUM5NC43NzQgNy43MTA5OSA5MS42MzMgNi43Mzk5OSA4Ny44MjkgNi43Mzk5OUM4NS43MTggNi43Mzk5OSA4My44MTEgNy4wNzQ5OSA4Mi4xMTIgNy43NDE5OUM4MC40MTMgOC40MDc5OSA3OC45NTYgOS4zNDQ5OSA3Ny43NCAxMC41NDVDNzYuNTI1IDExLjc0NyA3NS41OTIgMTMuMTk5IDc0LjkzNCAxNC44OThDNzQuMjc3IDE2LjU5NyA3My45NTEgMTguNDkxIDczLjk1MSAyMC41ODFDNzMuOTUxIDIyLjY3IDc0LjI4NiAyNC41MzQgNzQuOTUzIDI2LjI0NUM3NS42MTkgMjcuOTU3IDc2LjU2MiAyOS40MTQgNzcuNzc0IDMwLjYxN0M3OC45OSAzMS44MiA4MC40NDQgMzIuNzUzIDgyLjE0NiAzMy40MjNDODMuODQ1IDM0LjA5IDg1LjczOSAzNC40MjQgODcuODI5IDM0LjQyNEM4OS45MTkgMzQuNDI0IDkxLjcwOCAzNC4wOSA5My4zNDggMzMuNDIzQzk0LjcxOCAzMi44NjUgOTUuOTE4IDMyLjEyMSA5Ni45NDggMzEuMTkxQzk3LjE0OSAzMS4wMDggOTcuMzQ4IDMwLjgxNSA5Ny41MzcgMzAuNjJMOTMuNzAxIDI3Ljg4NUw5My42OTggMjcuODc2Wk0xMTAuODAyIDE0LjAxNUMxMDkuMTk5IDE0LjAxNSAxMDYuODM2IDE0LjQ3MSAxMDUuNjExIDE2LjE1OEwxMDUuNTM3IDYuMDE1OTlIMTAwLjc2NVYzMy45MzlIMTA1LjcyVjIyLjY0MUMxMDUuNzcxIDIxLjQ2MDcgMTA2LjI4OCAyMC4zNDg4IDEwNy4xNTcgMTkuNTQ4OUMxMDguMDI3IDE4Ljc0OTEgMTA5LjE3OCAxOC4zMjY2IDExMC4zNTggMTguMzc0QzExMy4zOTcgMTguMzc0IDExNC4yNjggMjEuMTU5IDExNC4yNjggMjIuNjQxVjMzLjkzOUgxMTkuMjIzVjIxLjA1OUMxMTkuMjIzIDIxLjA1OSAxMTkuMTQyIDE0LjAxNSAxMTAuODAyIDE0LjAxNVpNMTczLjc2MyAxNC4zNThIMTY5Ljk5OVY4LjcxNDk5SDE2NS4wNDhWMTQuMzU4SDE2MS4yODRWMTguOTE2SDE2NS4wNDhWMzQuMDAzSDE2OS45OTlWMTguOTE2SDE3My43NjNWMTQuMzU4Wk0xOTAuNzg3IDI1LjI2MkMxOTAuMTI5IDI0LjUwMTQgMTg5LjMwNyAyMy44OTk0IDE4OC4zODQgMjMuNTAxQzE4Ny40ODggMjMuMTE3IDE4Ni4zMzEgMjIuNzMyIDE4NC45NDggMjIuMzY0QzE4NC4xNjUgMjIuMTQzOSAxODMuMzkgMjEuODk3OCAxODIuNjIzIDIxLjYyNkMxODIuMTYzIDIxLjQ2MjEgMTgxLjc0MSAyMS4yMDY2IDE4MS4zODMgMjAuODc1QzE4MS4yMzUgMjAuNzQyMSAxODEuMTE4IDIwLjU3ODkgMTgxLjAzOSAyMC4zOTY0QzE4MC45NjEgMjAuMjE0IDE4MC45MjIgMjAuMDE2NiAxODAuOTI3IDE5LjgxOEMxODAuOTI3IDE5LjI3MiAxODEuMTU2IDE4Ljg0NCAxODEuNjI1IDE4LjUxQzE4Mi4xMjEgMTguMTU2IDE4Mi44NjIgMTcuOTc2IDE4My44MjYgMTcuOTc2QzE4NC43OSAxNy45NzYgMTg1LjU4NyAxOC4yMDkgMTg2LjE0OCAxOC42NjhDMTg2LjcwNiAxOS4xMjQgMTg3LjAwNyAxOS43MjUgMTg3LjA3MiAyMC41TDE4Ny4wOTQgMjAuNzgySDE5MS42MzNMMTkxLjYxNyAyMC40NkMxOTEuNTIxIDE4LjQ4NSAxOTAuNzcxIDE2LjkgMTg5LjM4NSAxNS43NUMxODguMDEyIDE0LjYxMiAxODYuMTg1IDE0LjAzMyAxODMuOTYyIDE0LjAzM0MxODIuNDc3IDE0LjAzMyAxODEuMTQxIDE0LjI4NyAxNzkuOTk0IDE0Ljc4NkMxNzguODMxIDE1LjI5MSAxNzcuOTI2IDE1Ljk5NSAxNzcuMjk2IDE2Ljg4MkMxNzYuNjczIDE3Ljc0NTUgMTc2LjMzOCAxOC43ODQgMTc2LjM0MSAxOS44NDlDMTc2LjM0MSAyMS4xNjcgMTc2LjY5OCAyMi4yNDkgMTc3LjM5OSAyMy4wNjRDMTc4LjA2IDIzLjg0MzIgMTc4Ljg5OCAyNC40NTM0IDE3OS44NDIgMjQuODQ0QzE4MC43NDQgMjUuMjE2IDE4MS45MjggMjUuNjA3IDE4My4zNjEgMjZDMTg0LjgwNiAyNi40MSAxODUuODcyIDI2Ljc4NSAxODYuNTMgMjcuMTIzQzE4Ny4xIDI3LjQxNCAxODcuMzc5IDI3Ljg0NSAxODcuMzc5IDI4LjQ0NEMxODcuMzc5IDI5LjA0MiAxODcuMTIyIDI5LjQ2NyAxODYuNTk1IDI5LjgzOUMxODYuMDQzIDMwLjIyNiAxODUuMjM3IDMwLjQyNSAxODQuMjAxIDMwLjQyNUMxODMuMTY2IDMwLjQyNSAxODIuMzk0IDMwLjE3NCAxODEuNzQ5IDI5LjY3NEMxODEuMTEzIDI5LjE4MSAxODAuNzcyIDI4LjU4OSAxODAuNzEgMjcuODY0TDE4MC42ODUgMjcuNTgySDE3Ni4wMTNMMTc2LjAyNSAyNy45MDFDMTc2LjA2NyAyOS4wOTU1IDE3Ni40NzIgMzAuMjQ4NyAxNzcuMTg4IDMxLjIwNkMxNzcuOTA3IDMyLjE4IDE3OC44OTMgMzIuOTU4IDE4MC4xMTggMzMuNTE5QzE4MS4zMzYgMzQuMDc3IDE4Mi43MzIgMzQuMzYyIDE4NC4yNjYgMzQuMzYyQzE4NS44MDEgMzQuMzYyIDE4Ny4xMDkgMzQuMTA4IDE4OC4yMzggMzMuNjA5QzE4OS4zNzYgMzMuMTA0IDE5MC4yNzIgMzIuMzk0IDE5MC45MDEgMzEuNDk0QzE5MS41MzQgMzAuNTkyIDE5MS44NTMgMjkuNTU0IDE5MS44NTMgMjguNDAzQzE5MS44MjggMjcuMTEgMTkxLjQ2NiAyNi4wNTMgMTkwLjc3NyAyNS4yNjJIMTkwLjc4N1oiIGZpbGw9IiM5QjlCOUIiLz4KPHBhdGggZD0iTTI0MS45ODIgMjUuNjU4MlYxNy43MTE3SDIyOC40NDFMMjIwLjQ5NCAyNS42NTgySDI0MS45ODJaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yNTcuMjM5IDUuOTUwODFIMjQwLjI2NUwyMzIuMjU1IDEzLjg5NzNIMjU3LjIzOVY1Ljk1MDgxWiIgZmlsbD0iIzlCOUI5QiIvPgo8cGF0aCBkPSJNMjEyLjYxMSAzMy42MDQ4TDIxNi42OCAyOS41MzYxSDIzMC40MTJWMzcuNDgyN0gyMTIuNjExVjMzLjYwNDhaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yMTUuNTk5IDIxLjc4MDNIMjI0LjM3MkwyMzIuMzgyIDEzLjgzMzdIMjE1LjU5OVYyMS43ODAzWiIgZmlsbD0iIzlCOUI5QiIvPgo8cGF0aCBkPSJNMjA2IDMzLjYwNDdIMjEyLjYxMUwyMjAuNDk0IDI1LjY1ODJIMjA2VjMzLjYwNDdaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yNDAuMjY1IDUuOTUwODFMMjM2LjE5NyAxMC4wMTk0SDIxMC4yNTlWMi4wNzI4OEgyNDAuMjY1VjUuOTUwODFaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=`;

const LICENSE_TYPES = {
    '01': 'GRID',
    '02': 'CHARTS',
    '0102': 'BOTH',
};

const LICENSING_HELP_URL = 'https://www.ag-grid.com/charts/licensing/';

export class LicenseManager {
    private static readonly RELEASE_INFORMATION: string = 'MTc3NDQyMzQyMDQyMQ==';
    private static licenseKey?: string;
    private static gridContext: boolean = false;
    private static licenseOutputLogged = false;
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
        const licenseDetails = this.getLicenseDetails(LicenseManager.licenseKey!, LicenseManager.gridContext);
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

        LicenseManager.licenseOutputLogged = true;
    }

    private static extractExpiry(license: string) {
        const restrictionHashed = license.substring(license.lastIndexOf('_') + 1, license.length);
        return new Date(Number.parseInt(LicenseManager.decode(restrictionHashed), 10));
    }

    private static extractLicenseComponents(licenseKey: string) {
        // when users copy the license key from a PDF extra zero width characters are sometimes copied too
        // carriage returns and line feeds are problematic too
        // all of which causes license key validation to fail - strip these out
        let cleanedLicenseKey = licenseKey.replaceAll(/[\u200B-\u200D\uFEFF]/g, '');
        cleanedLicenseKey = cleanedLicenseKey.replaceAll(/\r?\n|\r/g, '');

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
        let valid = md5 === this.md5.md5(license) && !licenseKey.includes('For_Trialing_ag-Grid_Only');
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
            valid = !Number.isNaN(expiry.getTime());

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
            (!this.isLocalhost() && !this.isE2ETest() && !this.isWebsiteUrl() && !missingOrEmpty(this.watermarkMessage))
        );
    }

    public getWatermarkMessage(): string {
        return this.watermarkMessage ?? '';
    }

    public getWatermarkForegroundConfig(): object | undefined {
        const message = this.getWatermarkMessage();
        if (!message) {
            return undefined;
        }
        return this.buildWatermarkConfig(message);
    }

    public getWatermarkForegroundConfigForBrowser(): object | undefined {
        if (!this.isDisplayWatermark()) {
            return undefined;
        }
        const message = this.getWatermarkMessage();
        if (!message) {
            return undefined;
        }
        return this.buildWatermarkConfig(message);
    }

    private buildWatermarkConfig(text: string): object {
        return {
            text,
            image: {
                url: WATERMARK_SVG_DATA_URL,
                width: 170,
                height: 25,
                right: 25,
                bottom: 50,
                opacity: 0.7,
            },
        };
    }

    private getHostname(): string {
        if (!this.document) {
            return 'localhost';
        }
        const win = this.document.defaultView ?? globalThis;
        if (!win) {
            return 'localhost';
        }
        try {
            const hostname = win.location?.hostname ?? '';
            return hostname || 'localhost';
        } catch {
            return 'localhost';
        }
    }

    private isForceWatermark(): boolean {
        if (!this.document) {
            return false;
        }
        const win = this.document?.defaultView ?? globalThis.window != undefined ? globalThis : undefined;
        if (!win) {
            return false;
        }

        const pathname = win.location?.pathname;
        return pathname ? pathname.includes('forceWatermark') : false;
    }

    private isWebsiteUrl(): boolean {
        const hostname = this.getHostname();
        return (
            /^((?:[\w-]+\.)?ag-grid\.com)$/.exec(hostname) !== null ||
            /^((?:[\w-]+\.)?bryntum\.com)$/.exec(hostname) !== null
        );
    }

    private isLocalhost(): boolean {
        const hostname = this.getHostname();
        return /^(?:127\.0\.0\.1|localhost)$/.exec(hostname) !== null;
    }

    private isE2ETest(): boolean {
        const hostname = this.getHostname();
        return /^(?:172\.17\.0\.1|host\.docker\.internal)$/.exec(hostname) !== null;
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
        return new Date(Number.parseInt(LicenseManager.decode(LicenseManager.RELEASE_INFORMATION), 10));
    }

    private static decode(input: string): string {
        const keystr: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let t = '';
        let n: any, r: any, i: any;
        let s: any, o: any, u: any, a: any;
        let f: number = 0;
        const e: string = input.replaceAll(/[^A-Za-z0-9+/=]/g, '');
        while (f < e.length) {
            s = keystr.indexOf(e.charAt(f++));
            o = keystr.indexOf(e.charAt(f++));
            u = keystr.indexOf(e.charAt(f++));
            a = keystr.indexOf(e.charAt(f++));
            n = (s << 2) | (o >> 4);
            r = ((o & 15) << 4) | (u >> 2);
            i = ((u & 3) << 6) | a;
            t = t + String.fromCodePoint(n);
            if (u != 64) {
                t = t + String.fromCodePoint(r);
            }
            if (a != 64) {
                t = t + String.fromCodePoint(i);
            }
        }
        t = LicenseManager.utf8_decode(t);
        return t;
    }

    private static utf8_decode(input: string): string {
        input = input.replaceAll('rn', 'n');
        let t = '';
        for (let n = 0; n < input.length; n++) {
            const r = input.codePointAt(n)!;
            if (r < 128) {
                t += String.fromCodePoint(r);
            } else if (r > 127 && r < 2048) {
                t += String.fromCodePoint((r >> 6) | 192);
                t += String.fromCodePoint((r & 63) | 128);
            } else {
                t += String.fromCodePoint((r >> 12) | 224);
                t += String.fromCodePoint(((r >> 6) & 63) | 128);
                t += String.fromCodePoint((r & 63) | 128);
            }
        }
        return t;
    }

    public static setGridContext(gridContext = false) {
        LicenseManager.gridContext = gridContext;
    }

    public static setLicenseKey(licenseKey?: string): void {
        if (this.licenseKey && this.licenseKey !== licenseKey) {
            console.warn(
                `License Key being set multiple times with different values. This can result in an incorrect license key being used.`
            );
        }

        if (this.licenseKey !== licenseKey) {
            LicenseManager.licenseOutputLogged = false;
        }
        LicenseManager.licenseKey = licenseKey;
    }

    private static extractBracketedInformation(licenseKey: string): [string | null, boolean | null, string?] {
        // legacy no trial key
        if (!licenseKey.includes('[')) {
            return ['legacy', false, undefined];
        }

        // eslint-disable-next-line sonarjs/slow-regex
        const matches = licenseKey.match(/\[(.*?)\]/g)!.map((match) => match.replace('[', '').replace(']', ''));
        if (!matches || matches.length === 0) {
            return ['legacy', false, undefined];
        }

        const isTrial = matches.filter((match) => match === 'TRIAL').length === 1;
        const rawVersion = matches.find((match) => match.startsWith('v'));
        const version = rawVersion ? rawVersion.replace('v', '') : 'legacy';
        const type = (LICENSE_TYPES as any)[matches.find((match) => (LICENSE_TYPES as any)[match])!];

        return [version, isTrial, type];
    }

    private centerPadAndOutput(input: string) {
        if (LicenseManager.licenseOutputLogged) return;
        const paddingRequired = this.totalMessageLength - input.length;
        console.error(input.padStart(paddingRequired / 2 + input.length, '*').padEnd(this.totalMessageLength, '*'));
    }

    private padAndOutput(input: string, padding = '*', terminateWithPadding = '') {
        if (LicenseManager.licenseOutputLogged) return;
        console.error(
            input.padEnd(this.totalMessageLength - terminateWithPadding.length, padding) + terminateWithPadding
        );
    }

    private outputInvalidLicenseKey(
        incorrectLicenseType: boolean,
        currentLicenseName: string,
        suppliedLicenseName: string
    ) {
        if (!LicenseManager.gridContext) {
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
        if (!LicenseManager.gridContext) {
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
        if (!LicenseManager.gridContext) {
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
        if (!LicenseManager.gridContext) {
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
