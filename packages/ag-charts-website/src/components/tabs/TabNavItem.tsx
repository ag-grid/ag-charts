import classnames from 'classnames';

export const TabNavItem = ({
    label,
    selected,
    setSelected,
}: {
    label: string;
    selected: string;
    setSelected: (label: string) => void;
}) => {
    return (
        <li key={label} className="tabs-nav-item" role="presentation">
            <button
                className={classnames('button-style-none', 'tabs-nav-link', {
                    active: label === selected,
                })}
                onClick={(e) => {
                    setSelected(label);
                    e.preventDefault();
                }}
                role="tab"
                disabled={label === selected}
            >
                {label}
            </button>
        </li>
    );
};
