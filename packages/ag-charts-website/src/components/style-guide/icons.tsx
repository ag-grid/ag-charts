import { ICON_MAP, Icon, type IconName } from '../icon/Icon';

export const Icons = () => {
    return (
        <>
            {Object.keys(ICON_MAP).map((key) => {
                return (
                    <div key={key}>
                        <p className="item-label">
                            <Icon name={key as IconName} /> <code>&lt;Icon name="{key}" /&gt;</code>
                        </p>
                    </div>
                );
            })}
        </>
    );
};
