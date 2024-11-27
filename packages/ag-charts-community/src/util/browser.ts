import { getWindow } from './dom';
import { Logger } from './logger';

const isSafariRegexp = /^((?!chrome|android).)*safari/i;
const safariVersionRegexp = /Version\/(\d+(\.\d+)?)/;
const isChromeRegexp = /Chrome/;
const chromeVersionRegexp = /Chrome\/(\d+)/;
const isEdge = /Edg/;
const isOpera = /OPR/;

export function isUnsupportedBrowser() {
    const { userAgent } = getWindow().navigator;

    if (isSafariRegexp.test(userAgent)) {
        const version = parseFloat(safariVersionRegexp.exec(userAgent)?.[1] ?? '0');

        const supported = Math.floor(version) > 16;
        if (!supported) {
            Logger.warnOnce(`Unsupported Safari version: ${version} ; ${userAgent}`);
        }

        return !supported;
    } else if (isChromeRegexp.test(userAgent) && !isEdge.test(userAgent) && !isOpera.test(userAgent)) {
        const version = parseInt(chromeVersionRegexp.exec(userAgent)?.[1] ?? '0', 10);

        // 127 as that is the minimum version for Playwright e2e tests.
        const supported = version > 126;

        if (!supported) {
            Logger.warnOnce(`Unsupported Chrome version: ${version} ; ${userAgent}`);
        }

        return !supported;
    }

    return false;
}
