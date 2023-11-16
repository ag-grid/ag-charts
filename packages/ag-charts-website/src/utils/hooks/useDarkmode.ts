import { useStore } from '@nanostores/react';
import { $darkmode } from '@stores/darkmodeStore';

export const useDarkmode = () => {
    const darkmode = useStore($darkmode);

    return darkmode === 'true';
};
