import { $darkmode, type DarkModeTheme } from '@stores/darkmodeStore';

import { useStoreSsr } from './useStoreSsr';

export const useDarkmode = () => {
    const darkmode = useStoreSsr<DarkModeTheme>($darkmode, 'unknown');

    return darkmode === 'dark';
};
