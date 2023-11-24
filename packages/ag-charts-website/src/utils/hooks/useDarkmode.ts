import { $darkmode, type DarkModeTheme, setDarkmode } from '@stores/darkmodeStore';

import { useStoreSsr } from './useStoreSsr';

export const useDarkmode = () => {
    const darkmode = useStoreSsr<DarkModeTheme>($darkmode, 'unknown');

    return [darkmode === 'true', setDarkmode] as const;
};
