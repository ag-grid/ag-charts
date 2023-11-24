import { useDarkmode } from '@utils/hooks/useDarkmode';
import classNames from 'classnames';

import { Icon } from '../icon/Icon';
import gridHeaderStyles from './gridSiteHeader.module.scss';

export const DarkModeToggle = () => {
    const [darkmode, setDarkmode] = useDarkmode();

    return (
        <li className={classNames(gridHeaderStyles.navItem, gridHeaderStyles.buttonItem)}>
            <button
                className={classNames(gridHeaderStyles.navLink, 'button-style-none')}
                onClick={() => setDarkmode(!darkmode)}
            >
                {darkmode ? <Icon name="sun" /> : <Icon name="moon" />}
            </button>
        </li>
    );
};
