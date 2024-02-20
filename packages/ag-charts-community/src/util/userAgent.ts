// Mobile browsers have stricter memory limits, we reduce rendering resolution to
// improve stability on mobile browsers. iOS Safari 12->16 are pain-points since they
// have memory allocation quirks - see https://bugs.webkit.org/show_bug.cgi?id=195325.
// Fixed in https://webkit.org/blog/14390/release-notes-for-safari-technology-preview-174/
export function hasConstrainedCanvasMemory() {
    if (typeof navigator === 'undefined') {
        return false;
    }

    const iPhoneOSMatch = navigator.userAgent.match(/\(iPhone; CPU iPhone OS (\d+_\d+_\d+) like Mac OS X\)/);

    if (iPhoneOSMatch == null) {
        return false;
    }

    const [major, minor] = iPhoneOSMatch[1].split('_').map(Number);
    return major < 16 || (major === 16 && minor < 6);
}
