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

        const supported = version >= 115;

        if (!supported) {
            Logger.default.warnOnce(`Unsupported Chrome version: ${version}; ${userAgent}`);
        }

        return !supported;
    }

    return false;
}
