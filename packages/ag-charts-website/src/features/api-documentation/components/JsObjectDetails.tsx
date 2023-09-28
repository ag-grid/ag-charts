import classnames from 'classnames';
import type { FunctionComponent, ReactNode } from 'react';

import type { JsObjectSelection } from '../types';
import styles from './ApiDocumentation.module.scss';
import { JsObjectPropertyView } from './JsObjectPropertyView';

interface Props {
    selection: JsObjectSelection;
}

function JsObjectDetailsContainer({ children }: { children: ReactNode }) {
    return (
        <div className={styles.apiReferenceOuter}>
            <table className={classnames(styles.reference, styles.apiReference, 'no-zebra')}>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

export const JsObjectDetails: FunctionComponent<Props> = ({ selection }) => {
    return (
        <JsObjectDetailsContainer>
            <JsObjectPropertyView selection={selection} />
            {/* For debugging
            <tr>
                <td colSpan={2}>
                    <pre>{JSON.stringify(selection, null, 2)}</pre>
                </td>
            </tr> */}
        </JsObjectDetailsContainer>
    );
};
