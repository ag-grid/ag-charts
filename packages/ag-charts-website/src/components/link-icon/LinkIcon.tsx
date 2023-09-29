import { Icon } from '@components/icon/Icon';
import type { FunctionComponent } from 'react';

import './LinkIcon.module.scss';

interface Props {
    href: string;
}

export const LinkIcon: FunctionComponent<Props> = ({ href }) => {
    return (
        <a href={href} className="docs-header-icon">
            <Icon name="link" />
        </a>
    );
};
