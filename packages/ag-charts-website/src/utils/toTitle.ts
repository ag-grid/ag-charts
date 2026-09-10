export function toTitle(str: string | undefined) {
    if (str == null || str === '') {
        return '';
    }
    const replacedDashes = str.replaceAll('-', ' ');
    const strSplit = replacedDashes.split(' ');
    const capitalised = strSplit
        .map((s) => {
            if (s === '') {
                return '';
            }
            return s[0].toLocaleUpperCase() + s.slice(1);
        })
        .filter(Boolean);
    return capitalised.join(' ');
}
