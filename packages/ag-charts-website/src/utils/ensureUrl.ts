export const ensureTrailingSlash = (str: string) => (str.endsWith('/') ? str : str + '/');
