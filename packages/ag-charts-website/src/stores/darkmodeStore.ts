import { persistentAtom } from '@nanostores/persistent';

const LOCALSTORAGE_PREFIX = 'documentation';

export type DarkModeTheme = 'true' | 'false';

export const $darkmode = persistentAtom<DarkModeTheme | undefined>(`${LOCALSTORAGE_PREFIX}:darkmode`, undefined, {
    listen: false,
});

const updateHtml = (darkmode: DarkModeTheme | undefined) => {
    if (typeof document === 'undefined') {
        return;
    }

    const htmlEl = document.documentElement;

    // Using .no-transitions class so that there are no animations between light/dark modes
    htmlEl.classList.add('no-transitions');
    htmlEl.dataset.darkMode = darkmode ?? 'false';
    htmlEl.offsetHeight; // Trigger a reflow, flushing the CSS changes
    htmlEl.classList.remove('no-transitions');
};

$darkmode.listen(updateHtml);
updateHtml($darkmode.get());

export const setDarkmode = (darkmode: boolean) => {
    $darkmode.set(darkmode ? 'true' : 'false');
};

export const getDarkmode = (): DarkModeTheme | undefined => {
    return $darkmode.get();
};
