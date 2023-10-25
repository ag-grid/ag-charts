import { Icon } from '@components/icon/Icon';
import classnames from 'classnames';

import styles from './ApiDocumentation.module.scss';

export function ToggleDetails({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
    return (
        <button className={classnames(styles.seeMore, 'button-as-link')} role="presentation" onClick={onToggle}>
            {!isOpen ? 'More' : 'Hide'} details <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} />
        </button>
    );
}
