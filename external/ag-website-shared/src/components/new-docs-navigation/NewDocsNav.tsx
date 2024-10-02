import { Icon } from '@ag-website-shared/components/icon/Icon';
import classnames from 'classnames';

import styles from './NewDocsNav.module.scss';

function Item({ itemData }: { itemData?: any }) {
    return (
        <a href="#" className={classnames(styles.item, itemData.icon ? styles.hasIcon : '')}>
            {itemData.icon && <Icon name={itemData.icon} svgClasses={styles.itemIcon} />}

            {itemData.title}
        </a>
    );
}

function Group({ groupData }: { groupData?: any }) {
    return (
        <div className={styles.group}>
            <button className={classnames('button-style-none', styles.groupTitle)}>
                <Icon name="chevronRight" svgClasses={styles.groupChevron} />
                <span>{groupData.title}</span>
            </button>

            <div className={styles.groupChildren}>
                {groupData.children.map((childData) => {
                    return <Item itemData={childData} />;
                })}
            </div>
        </div>
    );
}

function Section({ sectionData }: { sectionData?: any }) {
    return (
        <div className={styles.section}>
            <h5 className={styles.sectionTitle}>{sectionData.title}</h5>

            {sectionData.children.map((childData) => {
                return (
                    <>
                        {childData.type === 'item' && <Item itemData={childData} />}
                        {childData.type === 'group' && <Group groupData={childData} />}
                    </>
                );
            })}
        </div>
    );
}

export function NewDocsNav({ menuData }: { menuData?: any }) {
    return (
        <div className={styles.docsNav}>
            {menuData.sections.map((sectionData, i) => {
                return (
                    <>
                        <Section sectionData={sectionData} />
                        {i !== menuData.sections.length - 1 && <hr className={styles.divider} />}
                    </>
                );
            })}
        </div>
    );
}
