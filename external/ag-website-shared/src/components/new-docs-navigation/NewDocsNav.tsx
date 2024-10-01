function Item({ itemData }: { itemData?: any }) {
    return <p style={{ color: 'blue' }}>{itemData.title}</p>;
}

function Group({ groupData }: { groupData?: any }) {
    return (
        <div>
            <p style={{ color: 'red' }}>{groupData.title}</p>
            {groupData.children.map((childData) => {
                return <Item itemData={childData} />;
            })}
        </div>
    );
}

function Section({ sectionData }: { sectionData?: any }) {
    return (
        <div className="section">
            <h5 style={{ textTransform: 'uppercase' }}>{sectionData.title}</h5>

            {sectionData.children.map((childData) => {
                if (childData.type === 'item') return <Item itemData={childData} />;
                if (childData.type === 'group') return <Group groupData={childData} />;
            })}
        </div>
    );
}

export function NewDocsNav({ menuData }: { menuData?: any }) {
    return (
        <div className="docs-nav">
            {menuData.sections.map((sectionData) => {
                return <Section sectionData={sectionData} />;
            })}
        </div>
    );
}
