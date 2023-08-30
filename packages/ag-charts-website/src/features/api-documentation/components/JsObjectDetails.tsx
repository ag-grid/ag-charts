import classnames from 'classnames';
import styles from './ApiDocumentation.module.scss';
import type { FunctionComponent, ReactNode } from 'react';
import type { JsObjectSelection } from '../types';
import { JsObjectPropertyView } from './JsObjectPropertyView';
import type { Framework } from '@ag-grid-types';

interface Props {
    selection: JsObjectSelection;
    framework: Framework;
}

function JsObjectDetailsContainer({ children }: { children: ReactNode }) {
    return (
        <div className={styles.apiReferenceOuter}>
            <table className={classnames(styles.reference, styles.apiReference, 'no-zebra')}>
                <colgroup>
                    <col></col>
                    <col></col>
                </colgroup>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

export const JsObjectDetails: FunctionComponent<Props> = ({ selection, framework }) => {
    return (
        <JsObjectDetailsContainer>
            <JsObjectPropertyView selection={selection} framework={framework} />
            {/* For debugging
            <tr>
                <td colSpan={2}>
                    <pre>{JSON.stringify(selection, null, 2)}</pre>
                </td>
            </tr> */}
        </JsObjectDetailsContainer>
    );
};
