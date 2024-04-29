import LogoMarkSVG from '@ag-website-shared/images/inline-svgs/ag-grid-logomark.svg?react';
import type { FunctionComponent } from 'react';

import styles from './LogoMark.module.scss';

interface Props {
    bounce?: boolean;
    isSpinning?: boolean;
}

const LogoMark: FunctionComponent<Props> = ({ bounce, isSpinning }) => {
    const className = `logo-mark${bounce ? ` ${styles.bounce}` : ''}${isSpinning ? ` ${styles.loading}` : ''}`;

    return <LogoMarkSVG className={className} />;
};

export default LogoMark;
