import type { Framework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { Collapsible } from '@components/Collapsible';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
import classnames from 'classnames';
import { useState } from 'react';

import styles from './NewDocsNav.module.scss';

function getLinkUrl({ framework, path, url }: { framework: Framework; path?: string; url?: string }) {
    return url ? url : getExamplePageUrl({ framework, path: path! });
}

function Item({ itemData, framework, pageName }: { itemData?: any; framework: Framework; pageName: string }) {
    const linkUrl = getLinkUrl({ framework, path: itemData.path });
    const isActive = pageName === itemData.path;

    const className = classnames(styles.item, itemData.icon ? styles.hasIcon : '', isActive ? styles.isIsActive : '');

    return (
        <>
            {!itemData.children ? (
                <a href={linkUrl} className={className}>
                    {itemData.icon && <Icon name={itemData.icon} svgClasses={styles.itemIcon} />}

                    {itemData.title}

                    {itemData.isEnterprise && <Icon name="enterprise" svgClasses={styles.enterpriseIcon} />}
                </a>
            ) : (
                <div className={styles.nestedItems}>
                    {itemData.children.map((childData) => {
                        return <Item itemData={childData} framework={framework} pageName={pageName} />;
                    })}
                </div>
            )}
        </>
    );
}

function Group({
    groupData,
    framework,
    pageName,
    openGroup,
    setOpenGroup,
}: {
    groupData?: any;
    framework: Framework;
    pageName: string;
    openGroup?: any;
    setOpenGroup?: any;
}) {
    const isOpen = openGroup === groupData;

    return (
        <div className={classnames(styles.group, isOpen ? styles.isOpen : '')}>
            <button
                className={classnames('button-style-none', styles.groupTitle)}
                onClick={() => {
                    setOpenGroup(groupData);
                }}
            >
                <Icon name="chevronRight" svgClasses={styles.groupChevron} />

                <span>{groupData.title}</span>

                {groupData.isEnterprise && <Icon name="enterprise" svgClasses={styles.enterpriseIcon} />}
            </button>

            <Collapsible id={groupData.title} isOpen={isOpen}>
                <div className={styles.groupChildren}>
                    {groupData.children.map((childData) => {
                        return <Item itemData={childData} framework={framework} pageName={pageName} />;
                    })}
                </div>
            </Collapsible>
        </div>
    );
}

function Section({
    sectionData,
    framework,
    pageName,
    openGroup,
    setOpenGroup,
}: {
    sectionData?: any;
    framework: Framework;
    pageName: string;
    openGroup?: any;
    setOpenGroup?: any;
}) {
    return (
        <div className={styles.section}>
            <h5 className={styles.sectionTitle}>{sectionData.title}</h5>

            {sectionData.children.map((childData) => {
                return (
                    <>
                        {childData.type === 'item' && (
                            <Item itemData={childData} framework={framework} pageName={pageName} />
                        )}
                        {childData.type === 'group' && (
                            <Group
                                groupData={childData}
                                framework={framework}
                                pageName={pageName}
                                openGroup={openGroup}
                                setOpenGroup={setOpenGroup}
                            />
                        )}
                    </>
                );
            })}
        </div>
    );
}

export function NewDocsNav({
    menuData,
    framework,
    pageName,
}: {
    menuData?: any;
    framework: Framework;
    pageName: string;
}) {
    const [openGroup, setOpenGroup] = useState(menuData.sections[0].children[1]);

    return (
        <div className={styles.docsNavOuter}>
            <div className={styles.docsNavInner}>
                {menuData.sections.map((sectionData, i) => {
                    return (
                        <>
                            <Section
                                sectionData={sectionData}
                                framework={framework}
                                pageName={pageName}
                                openGroup={openGroup}
                                setOpenGroup={setOpenGroup}
                            />
                            {i !== menuData.sections.length - 1 && <hr className={styles.divider} />}
                        </>
                    );
                })}
            </div>
        </div>
    );
}
