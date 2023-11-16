import { persistentAtom } from '@nanostores/persistent';

const LOCALSTORAGE_PREFIX = 'documentation';

const IS_SSR = typeof window === 'undefined';

const isOSDarkmode = (
    !IS_SSR &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
).toString();

export const $darkmode = persistentAtom(`${LOCALSTORAGE_PREFIX}:darkmode`, isOSDarkmode, { listen: false });

export const setDarkmode = (darkmode: boolean) => {
    $darkmode.set(darkmode);

    const htmlEl = document.querySelector('html');

    // Using .no-transitions class so that there are no animations between light/dark modes
    htmlEl.classList.add('no-transitions');
    htmlEl.dataset.darkMode = darkmode ? 'true' : 'false';
    htmlEl.offsetHeight; // Trigger a reflow, flushing the CSS changes
    htmlEl.classList.remove('no-transitions');
};

export const getDarkmode = () => {
    return $darkmode.get() === 'true' || $darkmode.get() === true;
};
