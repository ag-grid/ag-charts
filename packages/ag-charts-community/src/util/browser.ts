import { Logger, getWindow } from 'ag-charts-core';

const isSafariRegexp = /^((?!chrome|android).)*safari/i;
const safariVersionRegexp = /Version\/(\d+(\.\d+)?)/;
const isChromeRegexp = /Chrome/;
const chromeVersionRegexp = /Chrome\/(\d+)/;
const isEdge = /Edg/;
const isOpera = /OPR/;

export function isUnsupportedBrowser() {
    const { userAgent } = getWindow('navigator');

    if (isSafariRegexp.test(userAgent)) {
        const versionExec = safariVersionRegexp.exec(userAgent);
        if (versionExec == null) return false;
        const version = Number.parseFloat(versionExec[1]);

        const supported = Math.floor(version) > 16;
        if (!supported) {
            Logger.default.warnOnce(`Unsupported Safari version: ${version}; ${userAgent}`);
        }

        return !supported;
    } else if (isChromeRegexp.test(userAgent) && !isEdge.test(userAgent) && !isOpera.test(userAgent)) {
        const versionExec = chromeVersionRegexp.exec(userAgent);
        if (versionExec == null) return false;
        const version = Number.parseInt(versionExec[1], 10);

        // 127 as that is the minimum version for Playwright e2e tests.
        const supported = version > 126;

        if (!supported) {
            Logger.default.warnOnce(`Unsupported Chrome version: ${version}; ${userAgent}`);
        }

        return !supported;
    }

    return false;
}
