const MOBILE = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];

export function isDesktop() {
    if (typeof navigator === 'undefined') {
        return true;
    }

    const userAgent = navigator.userAgent;

    return !MOBILE.some((r) => r.test(userAgent));
}
