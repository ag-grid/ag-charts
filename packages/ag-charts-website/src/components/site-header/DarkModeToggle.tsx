import gridHeaderStyles from '@design-system/modules/SiteHeader.module.scss';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import classNames from 'classnames';

import { Icon } from '../icon/Icon';

export const DarkModeToggle = () => {
    const [darkmode, setDarkmode] = useDarkmode();

    return (
        <button
            className={classNames(gridHeaderStyles.navLink, 'button-style-none')}
            onClick={() => setDarkmode(!darkmode)}
        >
            {darkmode ? <Icon name="sun" /> : <Icon name="moon" />}
            <span className={gridHeaderStyles.toggleDarkText}>Toggle Darkmode</span>
        </button>
    );
};
