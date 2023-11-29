export function hasConstrainedCanvasMemory() {
    // https://bugs.webkit.org/show_bug.cgi?id=195325
    // Fixed in https://webkit.org/blog/14390/release-notes-for-safari-technology-preview-174/
    if (typeof navigator === 'undefined') return false;

    const iPhoneOSMatch = navigator.userAgent.match(/\(iPhone; CPU iPhone OS (\d+_\d+_\d+) like Mac OS X\)/);
    if (iPhoneOSMatch == null) return false;

    const versionString = iPhoneOSMatch[1].split('_');
    const major = Number(versionString[0]);

    if (major > 16) {
        return false;
    } else if (major === 16) {
        const minor = Number(versionString[1]);
        return minor < 6;
    }
    return true;
}
