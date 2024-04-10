import { Icon } from '@ag-website-shared/components/icon/Icon';
import gridHeaderStyles from '@legacy-design-system/modules/SiteHeader.module.scss';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import classNames from 'classnames';

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
