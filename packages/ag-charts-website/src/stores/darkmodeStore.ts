import { persistentAtom } from '@nanostores/persistent';

const LOCALSTORAGE_PREFIX = 'documentation';

const isOSDarkmode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches).toString();

export const $darkmode = persistentAtom(`${LOCALSTORAGE_PREFIX}:darkmode`, isOSDarkmode);

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
    return !!$darkmode.get();
};
