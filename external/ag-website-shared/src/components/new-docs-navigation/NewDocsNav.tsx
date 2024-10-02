import type { Framework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
import classnames from 'classnames';

import styles from './NewDocsNav.module.scss';

function getLinkUrl({ framework, path, url }: { framework: Framework; path?: string; url?: string }) {
    return url ? url : getExamplePageUrl({ framework, path: path! });
}

function Item({ itemData, framework }: { itemData?: any; framework: Framework }) {
    const linkUrl = getLinkUrl({ framework, path: itemData.path });

    return (
        <a href={linkUrl} className={classnames(styles.item, itemData.icon ? styles.hasIcon : '')}>
            {itemData.icon && <Icon name={itemData.icon} svgClasses={styles.itemIcon} />}

            {itemData.title}

            {itemData.isEnterprise && <Icon name="enterprise" svgClasses={styles.enterpriseIcon} />}
        </a>
    );
}

function Group({ groupData, framework }: { groupData?: any; framework: Framework }) {
    return (
        <div className={styles.group}>
            <button className={classnames('button-style-none', styles.groupTitle)}>
                <Icon name="chevronRight" svgClasses={styles.groupChevron} />

                <span>{groupData.title}</span>

                {groupData.isEnterprise && <Icon name="enterprise" svgClasses={styles.enterpriseIcon} />}
            </button>

            <div className={styles.groupChildren}>
                {groupData.children.map((childData) => {
                    return <Item itemData={childData} framework={framework} />;
                })}
            </div>
        </div>
    );
}

function Section({ sectionData, framework }: { sectionData?: any; framework: Framework }) {
    return (
        <div className={styles.section}>
            <h5 className={styles.sectionTitle}>{sectionData.title}</h5>

            {sectionData.children.map((childData) => {
                return (
                    <>
                        {childData.type === 'item' && <Item itemData={childData} framework={framework} />}
                        {childData.type === 'group' && <Group groupData={childData} framework={framework} />}
                    </>
                );
            })}
        </div>
    );
}

export function NewDocsNav({ menuData, framework }: { menuData?: any; framework: Framework }) {
    return (
        <div className={styles.docsNav}>
            {menuData.sections.map((sectionData, i) => {
                return (
                    <>
                        <Section sectionData={sectionData} framework={framework} />
                        {i !== menuData.sections.length - 1 && <hr className={styles.divider} />}
                    </>
                );
            })}
        </div>
    );
}
