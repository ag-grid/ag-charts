import { persistentAtom } from '@nanostores/persistent';

const LOCALSTORAGE_PREFIX = 'documentation';

export type DarkModeTheme = 'unknown' | 'dark' | 'light';

export const $darkmode = persistentAtom<DarkModeTheme>(`${LOCALSTORAGE_PREFIX}:darkmodetheme`, 'unknown', {
    listen: false,
});

const updateHtml = (darkmode) => {
    if (typeof document === 'undefined') {
        return;
    }

    const htmlEl = document.documentElement;

    // Using .no-transitions class so that there are no animations between light/dark modes
    htmlEl.classList.add('no-transitions');
    htmlEl.dataset.darkMode = darkmode === 'dark' ? 'true' : 'false';
    htmlEl.offsetHeight; // Trigger a reflow, flushing the CSS changes
    htmlEl.classList.remove('no-transitions');
};

$darkmode.listen(updateHtml);
updateHtml($darkmode.get());

export const setDarkmode = (darkmode: boolean) => {
    $darkmode.set(darkmode ? 'dark' : 'light');
};

export const getDarkmode = (): DarkModeTheme => {
    return $darkmode.get();
};
