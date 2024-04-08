import LogoMarkSVG from '@ag-website-shared/images/inline-svgs/ag-grid-logomark.svg?react';
import styles from '@design-system/modules/LogoMark.module.scss';
import type { FunctionComponent } from 'react';

interface Props {
    bounce?: boolean;
    isSpinning?: boolean;
}

const LogoMark: FunctionComponent<Props> = ({ bounce, isSpinning }) => {
    const className = `logo-mark${bounce ? ` ${styles.bounce}` : ''}${isSpinning ? ` ${styles.loading}` : ''}`;

    return <LogoMarkSVG className={className} />;
};

export default LogoMark;
