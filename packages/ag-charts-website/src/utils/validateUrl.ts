const IS_SSR = typeof window === 'undefined';

export const validateUrl = (url: string) => {
    if (!IS_SSR) {
        return;
    }

    if (!url.includes(':') && !url.startsWith('#')) {
        if (!/^(\.|\.\.)?\//.test(url)) {
            // eslint-disable-next-line no-console
            console.warn(
                `Expected url "${url}" to start with either a slash (/), a dot slash (./), or a dot dot slash (../)`
            );
        }
        if (!url.split('#')[0].endsWith('/')) {
            // eslint-disable-next-line no-console
            console.warn(`Expected url "${url}" to end with a trailing slash (/)`);
        }
    }
};
